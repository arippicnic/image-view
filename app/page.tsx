"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";

import { FaCheck } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { RiDeleteBin7Line } from "react-icons/ri";
import { IoCopyOutline } from "react-icons/io5";
import { IoEyeOutline } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import { IoIosCut } from "react-icons/io";
import { FaGear } from "react-icons/fa6";

import { niceBytes } from "./helper/niceBytes";
import { imageType } from "./helper/imageType";
import ModalForm from "./components/ModalForm";
// import CropImage from "./components/CropImage";
import { TypeFormData, TypeImageURLS } from "./types";
import { stringToSlug } from "./helper/stringToSlug";
import { replaceSpecialString } from "./helper/replaceSpecialString";
import { downloadMulti } from "./helper/donwloadMulti";

import { compression } from "./helper/compress";

export default function Home() {
  const [imageURLS, setImageURLs] = useState<Array<TypeImageURLS>>([]);
  const [imageViewCrop, setImageCrop] = useState<{ url: string; id: number } | null>(null);
  const [pecentOF, setpecentOF] = useState(0);
  const [copyCode, setCopyCode] = useState(0);
  const [optionModal, setOptionModal] = useState(false);
  const [donwloadImage, setDonwloadImage] = useState(0);
  const [imageView, setImageView] = useState<string | null>(null);

  const [option, setOption] = useState<TypeFormData>({
    nameStart: 1,
    fileType: "webp",
    fileMaxSize: 0.2,
    nameApp: "name",
    namePage: "page",
    codeOuput: `<img src="/{name}" {alt} />`,
  });

  const onImageChange = (file: TypeImageURLS[]) => async (acceptedFiles: File[]) => {
    //test build
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
      const fileImages: Blob | undefined = await compression(image, newFiles.length, completedCount, option, setpecentOF);
      if (fileImages) {
        const img = URL.createObjectURL(fileImages);
        const id = index + new Date().valueOf();
        const size = niceBytes(fileImages.size);
        const name = Number(option.nameStart) + Number(index) - 1;
        const name_full = `img_${stringToSlug(option.namePage)}-${name}.${option.fileType}`;
        const alt = `alt="image ${option.fileType} ${option.namePage.toLocaleLowerCase()} ${option.nameApp}"`;
        const replacements = { "{name}": name_full, "{alt}": alt };
        const codeImg = replaceSpecialString(option.codeOuput, replacements);

        newImageUrls.push({ id, img, size, name, name_full, codeImg });
        completedCount = 100 / newFiles.length + completedCount;
      }
      index++;
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
      {/* <CropImage option={option} imageViewCrop={imageViewCrop} setImageCrop={setImageCrop} /> */}
      {imageView && (
        <div className="img-view-box">
          <img src={imageView} />
          <div className="nav bg-white">
            <IoIosCloseCircle color="black" onClick={() => setImageView(null)} className="item !mr-0" />
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
              <button onClick={() => setImageURLs([])} className="mr-2 bg-red-500 text-white font-bold py-2 px-4">
                Delete All
              </button>
              <button onClick={() => downloadMulti(imageURLS)} className="bg-blue-500 text-white font-bold py-2 px-4">
                Donwload All
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
                            downloadMulti([{ ...items }]);
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
