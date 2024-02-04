import { TypeFormData } from "../types";

export const removeTransparentPixelsFromFile = async (inputFile: File, option: TypeFormData): Promise<File> => {
  if (!inputFile.type.startsWith("image/png") || option.autoCrop === "no") {
    return inputFile;
  }
  return new Promise<File>((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = function (e) {
      if (e.target && e.target.result) {
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Could not get 2D context for the canvas."));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          context.drawImage(img, 0, 0, img.width, img.height);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const { data, width, height } = imageData;

          let minX = width;
          let minY = height;
          let maxX = 0;
          let maxY = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha > 0) {
              const x = (i / 4) % width;
              const y = Math.floor(i / 4 / width);
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }

          const newWidth = maxX - minX + 1;
          const newHeight = maxY - minY + 1;
          const newCanvas = document.createElement("canvas");
          newCanvas.width = newWidth;
          newCanvas.height = newHeight;

          const newContext = newCanvas.getContext("2d");

          if (!newContext) {
            reject(new Error("Could not get 2D context for the new canvas."));
            return;
          }
          newContext.drawImage(canvas, minX, minY, newWidth, newHeight, 0, 0, newWidth, newHeight);

          newCanvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], inputFile.name, {
                type: inputFile.type,
                lastModified: Date.now(),
              });

              resolve(newFile);
            } else {
              reject(new Error("Failed to convert canvas to Blob."));
            }
          }, inputFile.type);
        };

        img.src = e.target.result as string;
      }
    };

    reader.onerror = function (error) {
      reject(error);
    };

    reader.readAsDataURL(inputFile);
  });
};
