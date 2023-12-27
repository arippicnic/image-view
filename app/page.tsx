"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import { useDropzone, FileRejection } from "react-dropzone";
import JSZip from "jszip";
import ReactCrop, { type Crop, PixelCrop } from "react-image-crop";

import { FaCheck } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { RiDeleteBin7Line } from "react-icons/ri";
import { IoCopyOutline } from "react-icons/io5";
import { IoEyeOutline } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import { IoIosCut } from "react-icons/io";
import { FaGear } from "react-icons/fa6";

import { niceBytes } from "./helper/niceBytes";
import { removeTransparentPixelsFromFile } from "./helper/removeTransparentPixelsFromFile";
import { canvasPreview } from "./helper/canvasPreview";
import { imageType } from "./helper/imageType";
import ModalForm from "./components/modalForm";
import { TypeFormData, TypeImageURLS } from "./types";
import { stringToSlug } from "./helper/stringToSlug";
import { replaceSpecialString } from "./helper/replaceSpecialString";

export default function Home() {
  const [imageURLS, setImageURLs] = useState<Array<TypeImageURLS>>([]);
  const [imageURLSCrop, setImageURLsCrop] = useState<Array<TypeImageURLS>>([]);
  const [pecentOF, setpecentOF] = useState(0);
  const [copyCode, setCopyCode] = useState(0);
  const [optionModal, setOptionModal] = useState(false);
  const [donwloadImage, setDonwloadImage] = useState(0);
  const [imageView, setImageView] = useState<string | null>(null);
  const [imageViewCrop, setImageCrop] = useState<{ url: string; id: number } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const [option, setOption] = useState<TypeFormData>({
    nameStart: 1,
    fileType: "webp",
    fileMaxSize: 0.2,
    nameApp: "name",
    namePage: "page",
    codeOuput: `<img src="/{name}" {alt} />`,
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

  const handleDownload = (event: TypeImageURLS[]) => {
    console.log(event);
    event.forEach((value: TypeImageURLS, idx: number) => {
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
      fileType: `image/webp`,
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

  const onImageChange = (file: TypeImageURLS[]) => async (acceptedFiles: File[]) => {
    const newImageUrls: TypeImageURLS[] = file;
    const extractedFiles = acceptedFiles.filter((el: { type: string }) => el.type !== "application/zip");
    const extractedFilesZip = acceptedFiles.filter((el: { type: string }) => el.type === "application/zip");
    const newFiles: File[] = [...extractedFiles];
    let completedCount = 0;
    let index = 1;

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
      const fileImages: Blob | undefined = await compression(image, newFiles.length, completedCount);
      if (fileImages) {
        const img = URL.createObjectURL(fileImages);
        const id = index + new Date().valueOf();
        const size = niceBytes(fileImages.size);
        const name = index - 1;
        const name_full = `img_${stringToSlug(option.namePage)}-${name}.${option.fileType}`;
        const alt = `alt="image ${option.fileType} ${option.namePage.toLocaleLowerCase()} ${option.nameApp}"`;
        const replacements = { "{name}": name_full, "{alt}": alt };

        const codeImg = replaceSpecialString(option.codeOuput, replacements);

        newImageUrls.push({ id, img, size, name, name_full, codeImg });
        completedCount = 100 / newFiles.length + completedCount;
      }
    }
    setImageURLs(newImageUrls);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onImageChange([...imageURLS]),
    accept: {
      "image/*": [],
      "application/zip": [],
    },
  });

  return (
    <>
      <ModalForm option={option} setOption={setOption} modal={optionModal} setModal={setOptionModal} />
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
        <div className="my-4 cursor-pointer" onClick={() => setOptionModal(true)}>
          <FaGear color="white" className="icon" />
        </div>
        <div
          {...getRootProps()}
          className="text-center bg-white h-[100px] w-[200px] text-[black] flex p-8 items-center justify-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop</p> : <p>Drag or click</p>}
        </div>
        {pecentOF !== 0 && ![99, 100].includes(pecentOF) && <h2 className="mt-4">{pecentOF}%</h2>}
        {[99, 100].includes(pecentOF) && imageURLS.length !== 0 && (
          <>
            <div className="flex my-4">
              <button onClick={() => handleDownload(imageURLS)} className="bg-blue-500 text-white font-bold py-2 px-4">
                Donwload All
              </button>
              <button onClick={() => setImageURLs([])} className="ml-2 bg-red-500 text-white font-bold py-2 px-4">
                Delete All
              </button>
            </div>

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
