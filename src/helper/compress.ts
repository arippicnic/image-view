import { Dispatch, SetStateAction } from "react";

import { TypeFormData, TypeFile } from "../types";
import { removeTransparentPixelsFromFile } from "./removeTransparentPixelsFromFile";
import imageCompression from "browser-image-compression";

export async function compression(
  event: File,
  length: number,
  completedCount: number,
  option: TypeFormData,
  setpecentOF: Dispatch<SetStateAction<number>>,
  typeOf: string
) {
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: `image/${typeOf}`,
    onProgress: (i: number) => {
      const progressPercent = i / length + completedCount;
      const digitsOnly = parseInt(progressPercent.toString(), 10);
      setpecentOF(digitsOnly);
    },
  };

  try {
    const removeTransparent = await removeTransparentPixelsFromFile(event, option);
    const compressedFile = await imageCompression(removeTransparent, options);
    return compressedFile;
  } catch (error) {
    throw new Error("compression");
  }
}
