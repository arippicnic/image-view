import React, { useState, ChangeEvent, memo, Dispatch, SetStateAction, useEffect } from "react";
import { IoIosCloseCircle } from "react-icons/io";

import { setItemLocal, getItemLocal } from "../../src/helper/localStorageManager";
import { TypeFormData } from "../../src/types";

interface TypeCom {
  option: TypeFormData;
  setOption: Dispatch<SetStateAction<TypeFormData>>;
  modal: boolean;
  setModal: Dispatch<SetStateAction<boolean>>;
}

const ModalForm: React.FC<TypeCom> = ({ option, setOption, modal, setModal }) => {
  const [formData, setFormData] = useState<TypeFormData>(option);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let valSend: string | number = value;
    if (typeof value === "string") {
      valSend = value.replace(/ {2,}/g, " ");
    }
    if (name === "fileMaxSize") {
      const { min, max } = e.target as HTMLInputElement;
      if (valSend < min || valSend > max) {
        valSend = Math.max(Number(min), Math.min(Number(max), Number(value)));
      }
    }
    setFormData((prevData) => ({
      ...prevData,
      [name]: valSend,
    }));
  };

  const renderField = () => {
    return [
      {
        label: "Output Image",
        name: "fileType",
        type: "select",
        col: "col-span-2",
        selectData: ["png", "webp", "jpeg"],
      },
      { label: "Auto Crop PNG", name: "autoCrop", type: "select", col: "col-span-2", selectData: ["yes", "no"] },
    ].map((item, i) => (
      <div key={i} className={`${item.col} w-full`}>
        <label className="block mb-1 text-xs">{item.label}</label>
        {item.type === "textArea" && (
          <textarea
            onChange={handleInputChange}
            value={formData[item.name as keyof TypeFormData] as string}
            name={item.name}
            className="text-gray-900 p-2 w-full min-h-[5rem] whitespace-nowrap"
          ></textarea>
        )}
        {item.type === "select" && (
          <select
            name={item.name}
            onChange={handleInputChange}
            value={formData[item.name as keyof TypeFormData] as string}
            className="text-gray-900 p-2 w-full"
          >
            {item.selectData?.map((select, i) => (
              <option key={i} value={select}>
                {select}
              </option>
            ))}
          </select>
        )}
        {["text", "number"].includes(item.type) && item.name !== "fileMaxSize" && (
          <input
            type={item.type}
            name={item.name}
            className="text-gray-900 p-2 w-full"
            value={formData[item.name as keyof TypeFormData]}
            onChange={handleInputChange}
          />
        )}
        {item.name === "fileMaxSize" && (
          <input
            type="number"
            name={item.name}
            min="1"
            max="1000"
            className="text-gray-900 p-2 w-full"
            value={formData[item.name as keyof TypeFormData]}
            onChange={handleInputChange}
          />
        )}
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
    <>
      {modal && (
        <div className={`fixed top-0 right-0 left-0 z-50 justify-center max-h-full flex items-start`}>
          <div className="relative p-4 w-full max-w-md max-h-full">
            <div className="relative dark:bg-gray-700 p-4">
              <IoIosCloseCircle
                onClick={() => setModal(false)}
                color="white"
                className="cursor-pointer absolute right-[1rem] text-[1.7rem] item "
              />
              <form className="text-sm mt-10">
                <div className="grid grid-cols-4 gap-2 mb-5">{renderField()}</div>
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
      )}
    </>
  );
};

export default memo(ModalForm);
