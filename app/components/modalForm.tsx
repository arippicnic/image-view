import React, { useState, ChangeEvent, memo, Dispatch, SetStateAction, useEffect } from "react";
import { IoIosCloseCircle } from "react-icons/io";

import { setItemLocal, getItemLocal } from "../helper/localStorageManager";
import { TypeFormData } from "../types";

interface TypeCom {
  option: TypeFormData;
  setOption: Dispatch<SetStateAction<TypeFormData>>;
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
}

const ModalForm: React.FC<TypeCom> = ({ option, setOption, modal, setModal }) => {
  const [formData, setFormData] = useState<TypeFormData>(option);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let valSend = value;
    if (typeof value === "string") {
      valSend = value.replace(/ {2,}/g, " ");
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: valSend,
    }));
  };

  const renderField = () => {
    return [
      { label: "Name", name: "nameApp", type: "text" },
      { label: "Name Page", name: "namePage", type: "text" },
      { label: "Max Size(MB)", name: "fileMaxSize", type: "number" },
      { label: "Start Name", name: "nameStart", type: "number" },
      { label: "Output Image", name: "fileType", type: "text" },
      { label: "Code Image", name: "codeOuput", type: "text" },
    ].map((item, i) => (
      <div key={i}>
        <label className="block mb-1 text-xs">{item.label}</label>
        <input
          type={item.type}
          name={item.name}
          className="text-gray-900 p-2"
          value={formData[item.name as keyof TypeFormData]}
          onChange={handleInputChange}
        />
      </div>
    ));
  };

  useEffect(() => {
    const retrievedData: TypeFormData | null = getItemLocal("user_option");
    if (retrievedData) {
      setFormData(retrievedData);
      setOption(retrievedData);
    }
  }, []);

  return (
    <div className={`${modal ? "show" : "hidden"} fixed top-0 right-0 left-0 z-50 justify-center max-h-full flex items-start`}>
      <div className="relative p-4 w-full max-w-md max-h-full">
        <div className="relative dark:bg-gray-700 p-4">
          <IoIosCloseCircle
            onClick={() => setModal(false)}
            color="white"
            className="cursor-pointer absolute right-[1rem] text-[1.7rem] item "
          />
          <form className="text-sm mt-10">
            <div className="grid grid-cols-2 gap-2 mb-5">{renderField()}</div>
            <div className="flex justify-end w-full">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setOption(formData);
                  setItemLocal("user_option", formData);
                  setModal(false);
                }}
                className="bg-blue-500 text-white font-bold py-2 px-4"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default memo(ModalForm);
