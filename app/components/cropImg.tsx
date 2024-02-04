import { useState, useRef, memo, Dispatch, SetStateAction } from "react";
import ReactCrop, { type Crop, PixelCrop } from "react-image-crop";

import { IoIosCloseCircle } from "react-icons/io";
import { IoIosCut } from "react-icons/io";

import { niceBytes } from "../../src/helper/niceBytes";
import { canvasPreview } from "../../src//helper/canvasPreview";
import { TypeFormData, TypeImageURLS } from "../../src/types";

interface TypeCom {
  option: TypeFormData;
  imageViewCrop: { url: string; id: number } | null;
  setImageCrop: Dispatch<SetStateAction<{ url: string; id: number } | null>>;
  imageURLS: TypeImageURLS[];
  setImageURLs: Dispatch<SetStateAction<TypeImageURLS[]>>;
}

const CropImg: React.FC<TypeCom> = ({ option, imageViewCrop, setImageCrop, imageURLS, setImageURLs }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageURLSCrop, setImageURLsCrop] = useState<Array<TypeImageURLS>>([]);
  const [crop, setCrop] = useState<Crop>();

  async function handleCompletedCrop(pixelCrop: PixelCrop, id: number) {
    console.log(pixelCrop, id);
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
    </>
  );
};

export default memo(CropImg);
