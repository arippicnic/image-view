type FileType = {
  fileType: "png" | "webp" | "jpg" | "with-svg" | "original";
};

export type TypeFormData = {
  nameApp: string;
  namePage: string;
  fileMaxSize: number;
  nameStart: number;
  autoCrop: "yes" | "no";
  codeOuput: string;
} & FileType;

export type TypeImageURLS = {
  id: number;
  img: string;
  imgOriginal: string;
  name: string;
  codeImg: string;
  size: string;
  name_full: string;
  type: string | boolean;
} & FileType;
