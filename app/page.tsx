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

import { niceBytes } from "../src/helper/niceBytes";
import { imageType, imageTypeSvg } from "../src/helper/imageType";
import ModalForm from "./components/modalForm";
import CropImg from "./components/cropImg";
import { TypeFormData, TypeImageURLS } from "../src/types";
import { stringToSlug } from "../src/helper/stringToSlug";
import { replaceSpecialString } from "../src/helper/replaceSpecialString";
import { downloadMulti } from "../src/helper/donwloadMulti";
import { compression } from "../src/helper/compress";

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
    autoCrop: "yes",
  });

  const onImageChange = (file: TypeImageURLS[]) => async (acceptedFiles: File[]) => {
    const newImageUrls: TypeImageURLS[] = file;
    const extractedFiles = acceptedFiles.filter((el: { type: string }) => el.type !== "application/zip");
    const extractedFilesZip = acceptedFiles.filter((el: { type: string }) => el.type === "application/zip");
    const newFiles: File[] = [...extractedFiles];
    const legthFile = newFiles.filter((el: { type: string }) => el.type !== "image/svg+xml");
    const legthFileSvg = newFiles.filter((el: { type: string }) => el.type === "image/svg+xml");
    let completedCount = 0;
    let index = 1;
    let fileImages: Blob | undefined = undefined;

    if (extractedFilesZip.length !== 0) {
      for (const image of extractedFilesZip) {
        const zip = new JSZip();
        const zipFile = await zip.loadAsync(image);
        console.log(zipFile);
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
      console.log(image)
      if (["with-svg", "original"].includes(option.fileType) && image.type === "image/svg+xml") {
        const progressPercent = 100 / legthFileSvg.length + completedCount;
        const digitsOnly = parseInt(progressPercent.toString(), 10);
        setpecentOF(digitsOnly);
        fileImages = new Blob([image], { type: image.type  });
      } else {
        fileImages = await compression(image, legthFile.length, completedCount, option, setpecentOF);
      }
      if (fileImages) {
        let name = image.name;
        let name_full = name;
        let alt = `alt="image ${option.namePage.toLocaleLowerCase()} ${option.nameApp}"`;

        if (option.fileType !== "original") {
          const typeFIle = imageType(image.name);
          name = `${(Number(option.nameStart) + Number(index) - 1).toString()}.${typeFIle}`;
          name_full = `img_${stringToSlug(option.namePage)}-${name}.${typeFIle}`;
          alt = `alt="image ${typeFIle} ${option.namePage.toLocaleLowerCase()} ${option.nameApp}"`;
        }

        const replacements = { "{name}": name_full, "{alt}": alt };
        const codeImg = replaceSpecialString(option.codeOuput, replacements);
        const size = niceBytes(fileImages.size);
        const id = index + new Date().valueOf();
        const img = URL.createObjectURL(fileImages);
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
      <CropImg
        option={option}
        imageViewCrop={imageViewCrop}
        setImageCrop={setImageCrop}
        imageURLS={imageURLS}
        setImageURLs={setImageURLs}
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
          <FaGear color="white" className="icon" />
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
