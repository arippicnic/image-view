"use client";
<img src="/img_webstore-banner-6.webp" alt="image webp webstore banner axis" />;
import { useState, useEffect, useCallback, useRef, ChangeEvent } from "react";
import imageCompression from "browser-image-compression";
import { useDropzone } from "react-dropzone";
import { IoCopyOutline } from "react-icons/io5";
import ReactCrop, { type Crop, PixelCrop } from "react-image-crop";
import { FaCheck } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { niceBytes } from "./helper/niceBytes";
import { makeTitle } from "./helper/makeTitle";
import { RiDeleteBin7Line } from "react-icons/ri";
import { IoEyeOutline } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import { IoIosCut } from "react-icons/io";
import { removeTransparentPixelsFromFile } from "./helper/removeTransparentPixelsFromFile";
import { canvasPreview } from "./helper/canvasPreview";
import JSZip from "jszip";
import { imageType } from "./helper/imageType";
export default function Home() {
  const [imageURLS, setImageURLs] = useState<Array<any>>([]);
  const [imageURLSCrop, setImageURLsCrop] = useState<Array<any>>([]);
  const [pecentOF, setpecentOF] = useState(0);
  const [copyCode, setCopyCode] = useState(0);
  const [donwloadImage, setDonwloadImage] = useState(0);
  const [imageView, setImageView] = useState<string | null>(null);
  const [imageViewCrop, setImageCrop] = useState<{ url: string; id: number } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const [option, setOption] = useState({
    nameStart: 1,
    fileType: "webp",
    fileMaxSize: 0.2,
    nameApp: "axis",
    namePage: "paket-suka-suka",
  });

  const handleDownload = (event: any) => {
    event.forEach((value: any, idx: number) => {
      setTimeout(() => {
        fetch(value.img, {
          method: "GET",
          headers: {},
        })
          .then((response) => {
            response.arrayBuffer().then(function (buffer) {
              let link = document.createElement("a");

              if (link.download !== undefined) {
                const url = window.URL.createObjectURL(new Blob([buffer]));

                link.setAttribute("href", url);
                link.setAttribute("download", value.name_full);
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }, idx * 100);
    });
  };
  async function compression(event: File, length: number, completedCount: number) {
    const options = {
      maxSizeMB: option.fileMaxSize,
      alwaysKeepResolution: true,
      fileType: `image/${option.fileType}`,
      onProgress: (i: number) => {
        const progressPercent = i / length + completedCount;
        const digitsOnly = parseInt(progressPercent.toString(), 10);
        if (digitsOnly !== pecentOF) setpecentOF(digitsOnly);
      },
    };

    try {
      const removeTransparent = await removeTransparentPixelsFromFile(event);
      const compressedFile = await imageCompression(removeTransparent, options);
      return compressedFile;
    } catch (error) {
      console.log(error);
    }
  }

  const onImageChange = useCallback(async (acceptedFiles: any) => {
    const newImageUrls: any = [];
    const extractedFiles = acceptedFiles.filter((el: any) => el.type !== "application/zip");
    const extractedFilesZip = acceptedFiles.filter((el: any) => el.type === "application/zip");
    const newFiles: File[] = [...extractedFiles];
    let completedCount = 0;
    let index = 1;

    // console.log(newFiles);
    if (extractedFilesZip.length !== 0) {
      for (const image of extractedFilesZip) {
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(image);

        await Promise.all(
          Object.keys(zipFile.files).map(async (relativePath) => {
            const zipEntry = zipFile.files[relativePath];
            if (!zipEntry.dir) {
              if (imageType(zipEntry.name)) {
                const blob = await zipEntry.async("blob");
                const file = new File([blob], zipEntry.name, { type: "image/png" });
                newFiles.push(file);
              }
            }
          })
        );
      }
    }

    for (const image of newFiles) {
      index++;
      const fileImages: any = await compression(image, newFiles.length, completedCount);
      console.log(image);
      const img = URL.createObjectURL(fileImages);

      completedCount = 100 / newFiles.length + completedCount;
      const size = niceBytes(fileImages.size);

      const name = index - 1;
      const name_full = `img_${option.namePage}-${name}.${option.fileType}`;
      const codeImg = `<img src="/${name_full}" alt="image ${option.fileType} ${makeTitle(option.namePage)} ${
        option.nameApp
      }" />`;
      newImageUrls.push({ id: index, img, size, name, name_full, codeImg });
    }
    setImageURLs(newImageUrls);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onImageChange,
    accept: {
      "image/*": [],
      "application/zip": [],
    },
  });

  async function handleCompletedCrop(pixelCrop: PixelCrop, id: number) {
    const image = imgRef.current;
    if (!image || pixelCrop.width === 0) {
      return;
    }
    const canvas = document.createElement("canvas");
    canvasPreview(image, canvas, pixelCrop, 1, 0);

    return new Promise(() => {
      canvas.toBlob((blob) => {
        if (blob) {
          const img = URL.createObjectURL(blob);
          const size = niceBytes(blob.size);
          const newProjects = imageURLS.map((p) => (p.id === id ? { ...p, img, size } : p));
          setImageURLsCrop(newProjects);
        }
      }, `image/${option.fileType}`);
    });
  }

  return (
    <>
      {imageView && (
        <div className="img-view-box">
          <img src={imageView} />
          <div className="nav bg-white">
            <IoIosCloseCircle color="black" onClick={() => setImageView(null)} className="item !mr-0" />
          </div>
        </div>
      )}
      {imageViewCrop && (
        <div className="img-view-box">
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(e) => handleCompletedCrop(e, imageViewCrop.id)}>
            <img ref={imgRef} src={imageViewCrop.url} />
          </ReactCrop>
          <div className="nav bg-white">
            <IoIosCut
              color="black"
              className="item"
              onClick={() => {
                setImageURLs(imageURLSCrop);
                setImageCrop(null);
              }}
            />
            <IoIosCloseCircle color="black" className="item !mr-0" onClick={() => setImageCrop(null)} />
          </div>
        </div>
      )}

      <main className="flex justify-center flex-col items-center">
        <div
          {...getRootProps()}
          className="text-center bg-white h-[100px] w-[200px] text-[black] flex p-8 items-center justify-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop</p> : <p>Drag or click</p>}
        </div>
        {pecentOF !== 0 && pecentOF !== 100 && <h2 className="mt-4">{pecentOF}%</h2>}
        {pecentOF === 100 && imageURLS.length !== 0 && (
          <>
            <button
              onClick={() => handleDownload(imageURLS)}
              className="my-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Donwload All
            </button>
            {imageURLS.map((items, i) => (
              <div className="grid grid-cols-2 gap-2 mb-2" key={i}>
                <div className="border h-[fit-content] border-white bg-white">
                  <img src={items.img} alt="not fount" width={"200px"} />
                </div>
                <div className="border h-[fit-content] border-white p-2">
                  <p>Name: {items.name}</p>
                  <p>Size: {items.size}</p>
                  <div className="flex mt-3 items-center">
                    <div className="cursor-pointer">
                      <IoEyeOutline onClick={() => setImageView(items.img)} className="icon" />
                    </div>
                    <div className="cursor-pointer ml-3">
                      {donwloadImage === items.id ? (
                        <FaCheck color="green" className="icon" />
                      ) : (
                        <FiDownload
                          className="icon"
                          onClick={() => {
                            setDonwloadImage(items.id);
                            handleDownload([{ ...items }]);
                            setTimeout(() => {
                              setDonwloadImage(0);
                            }, 500);
                          }}
                        />
                      )}
                    </div>
                    <div className="cursor-pointer ml-3">
                      <IoIosCut
                        onClick={() => {
                          setImageCrop({ url: items.img, id: items.id });
                        }}
                        className="text-[1.7rem]"
                      />
                    </div>
                    <div className="cursor-pointer ml-3">
                      {copyCode === items.id ? (
                        <FaCheck color="green" className="icon" />
                      ) : (
                        <IoCopyOutline
                          className="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(items.codeImg);
                            setCopyCode(items.id);
                            setTimeout(() => {
                              setCopyCode(0);
                            }, 500);
                          }}
                        />
                      )}
                    </div>
                    <div className="cursor-pointer ml-3">
                      <RiDeleteBin7Line
                        onClick={() => {
                          setImageURLs(
                            imageURLS.filter(function (el) {
                              return el.id !== items.id;
                            })
                          );
                        }}
                        className="text-[1.7rem]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </main>
    </>
  );
}
