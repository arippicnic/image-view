"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import JSZip from "jszip";
import { Tooltip } from "react-tooltip";

import { FaCheck } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { RiDeleteBin7Line } from "react-icons/ri";
import { IoCopyOutline } from "react-icons/io5";
import { IoEyeOutline } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import { IoIosCut } from "react-icons/io";
import { FaGear } from "react-icons/fa6";
import { HiOutlineSaveAs } from "react-icons/hi";
import { FaUndo } from "react-icons/fa";

import { niceBytes } from "../src/helper/niceBytes";
import { imageType, imageTypeSvg } from "../src/helper/imageType";
import ModalForm from "./components/modalForm";
import CropImg from "./components/cropImg";
import { TypeFormData, TypeImageURLS } from "../src/types";
import { stringToSlug } from "../src/helper/stringToSlug";
import { replaceSpecialString } from "../src/helper/replaceSpecialString";
import { downloadMulti } from "../src/helper/donwloadMulti";
import { saveImage } from "@/src/helper/saveImage";
import { compression } from "../src/helper/compress";

export default function Home() {
  const [imageURLS, setImageURLs] = useState<Array<TypeImageURLS>>([]);
  const [imageViewCrop, setImageCrop] = useState<{ url: string; id: number } | null>(null);
  const [pecentOF, setpecentOF] = useState(0);

  const [undo, setUndo] = useState(false);
  const [optionModal, setOptionModal] = useState(false);
  const [donwloadImage, setDonwloadImage] = useState(0);
  const [imageView, setImageView] = useState<string | null>(null);
  const [option, setOption] = useState<TypeFormData>({
    fileType: "webp",
    autoCrop: "no",
  });

  const onImageChange = (file: TypeImageURLS[]) => async (acceptedFiles: File[]) => {
    const newImageUrls: TypeImageURLS[] = file;
    const extractedFiles = acceptedFiles.filter((el: { type: string }) => el.type !== "application/zip");
    const extractedFilesZip = acceptedFiles.filter((el: { type: string }) => el.type === "application/zip");
    const newFiles: File[] = [...extractedFiles];
    let completedCount = 0;
    let index = 1;
    let fileImages: Blob | undefined = undefined;

    if (extractedFilesZip.length !== 0) {
      for (const image of extractedFilesZip) {
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(image);

        await Promise.all(
          Object.keys(zipFile.files)
            .filter((key) => !key.match(/^__MACOSX\//))
            .map(async (relativePath) => {
              const zipEntry = zipFile.files[relativePath];
              if (!zipEntry.dir) {
                if (imageType(zipEntry.name)) {
                  const blob = await zipEntry.async("blob");
                  if (imageTypeSvg(zipEntry.name)) {
                    const file = new File([blob], "file", { type: "image/svg+xml" });
                    newFiles.push(file);
                  } else {
                    const file = new File([blob], "file", { type: "image/png" });
                    newFiles.push(file);
                  }
                }
              }
            })
        );
      }
    }

    for (const image of newFiles) {
      fileImages = await compression(image, newFiles.length, completedCount, option, setpecentOF, option.fileType);
      if (fileImages) {
        const typeFIle = option.fileType;
        const name = ``;
        const name_full = ``;

        const size = niceBytes(fileImages.size);
        const id = index + new Date().valueOf();
        const img = URL.createObjectURL(fileImages);

        newImageUrls.push({
          id,
          img,
          imgOriginal: img,
          size,
          name,
          name_full,
          type: typeFIle,
        });
        completedCount = 100 / newFiles.length + completedCount;
      }
      index++;
    }

    const newImageUrlsSend = newImageUrls.map((obj, i) => ({
      ...obj,
      name: `${i + 1}.${obj.type}`,
      name_full: `img_min-${i + 1}.${obj.type}`,
    }));

    setImageURLs(newImageUrlsSend);
    setOption({ ...option });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onImageChange([...imageURLS]),
    accept: {
      "image/*": [],
      "application/zip": [],
    },
  });

  useEffect(() => {
    if (imageURLS.length !== 0) {
      const alertUser = (e: BeforeUnloadEvent) => e.preventDefault();
      window.addEventListener("beforeunload", alertUser);
      return () => {
        window.removeEventListener("beforeunload", alertUser);
      };
    }
  }, [imageURLS]);

  return (
    <>
      <ModalForm option={option} setOption={setOption} modal={optionModal} setModal={setOptionModal} />
      <CropImg
        option={option}
        imageViewCrop={imageViewCrop}
        setImageCrop={setImageCrop}
        imageURLS={imageURLS}
        setImageURLs={setImageURLs}
        setUndo={setUndo}
      />
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
          <Tooltip id="tooltip-setting" place="bottom" />
          <FaGear data-tooltip-id="tooltip-setting" data-tooltip-content="Setting" color="white" className="icon" />
        </div>
        <div
          {...getRootProps()}
          className="text-center bg-white h-[100px] w-[200px] text-[black] flex p-8 items-center justify-center"
        >
          <input {...getInputProps()} />
          {isDragActive ? <p>Drop</p> : <p>Drag or click</p>}
        </div>
        {pecentOF !== 0 && pecentOF < 99 && <h2 className="mt-4">{pecentOF}%</h2>}
        {pecentOF > 99 && imageURLS.length !== 0 && (
          <>
            <div className="flex my-4">
              <button
                onClick={() => {
                  const answer = window.confirm("Are you sure you want to delete All Images");
                  if (answer) {
                    setImageURLs([]);
                  }
                }}
                className="mr-2 bg-red-500 text-white font-bold py-2 px-4"
              >
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
                      {donwloadImage === items.id ? (
                        <FaCheck color="green" className="icon" />
                      ) : (
                        <>
                          <Tooltip id="tooltip-donwload" />
                          <FiDownload
                            data-tooltip-id="tooltip-donwload"
                            data-tooltip-content="Donwload"
                            className="icon"
                            onClick={() => {
                              setDonwloadImage(items.id);
                              downloadMulti([{ ...items }]);
                              setTimeout(() => {
                                setDonwloadImage(0);
                              }, 500);
                            }}
                          />
                        </>
                      )}
                    </div>
                    <div className="cursor-pointer ml-3">
                      <Tooltip id="tooltip-crop" />
                      <IoIosCut
                        data-tooltip-id="tooltip-crop"
                        data-tooltip-content="Crop"
                        onClick={() => {
                          setImageCrop({ url: items.img, id: items.id });
                        }}
                        className="text-[1.7rem]"
                      />
                    </div>
                    {undo && (
                      <div className="cursor-pointer ml-3">
                        <Tooltip id="tooltip-undo" />
                        <FaUndo
                          data-tooltip-id="tooltip-undo"
                          data-tooltip-content="Undo"
                          onClick={() => {
                            const newProjects = imageURLS.map((p) => (p.id === items.id ? { ...p, img: items.imgOriginal } : p));
                            setImageURLs(newProjects);
                            setUndo(false);
                          }}
                          className="text-[1.2rem]"
                        />
                      </div>
                    )}
                    <div className="cursor-pointer ml-3">
                      <Tooltip id="tooltip-delete" />
                      <RiDeleteBin7Line
                        data-tooltip-id="tooltip-delete"
                        data-tooltip-content="Delete"
                        onClick={() => {
                          const answer = window.confirm("Are you sure you want to delete Image");
                          if (answer) {
                            setImageURLs(
                              imageURLS.filter(function (el) {
                                return el.id !== items.id;
                              })
                            );
                          }
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
