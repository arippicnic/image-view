import { Dispatch, SetStateAction } from "react";

import { TypeImageURLS, TypeFormData } from "../types";
import { removeTransparentPixelsFromFile } from "./removeTransparentPixelsFromFile";
import imageCompression from "browser-image-compression";

export async function compression(
  event: File,
  length: number,
  completedCount: number,
  option: TypeFormData,
  setpecentOF: Dispatch<SetStateAction<number>>
) {
  const options = {
    maxSizeMB: option.fileMaxSize,
    alwaysKeepResolution: true,
    fileType: `image/webp`,
    onProgress: (i: number) => {
      const progressPercent = i / length + completedCount;
      const digitsOnly = parseInt(progressPercent.toString(), 10);
      setpecentOF(digitsOnly);
    },
  };

  try {
    const removeTransparent = await removeTransparentPixelsFromFile(event);
    const compressedFile = await imageCompression(removeTransparent, options);
    return compressedFile;
  } catch (error) {
    throw new Error("compression");
  }
}
