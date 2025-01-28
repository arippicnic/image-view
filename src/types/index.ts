export type TypeFile = {
  fileType: "png" | "webp" | "jpeg";
};

export type TypeFormData = {
  autoCrop: "yes" | "no";
} & TypeFile;

export type TypeImageURLS = {
  id: number;
  img: string;
  imgOriginal: string;
  name: string;

  size: string;
  name_full: string;
  type: string;
};
