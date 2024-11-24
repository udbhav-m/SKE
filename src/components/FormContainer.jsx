/* eslint-disable react/prop-types */
// FormContainer.js
import React from "react";
const FormContainer = ({ children, onSubmit }) => {
  return (
    <div className="flex justify-center select-none">
      <div className="w-11/12 sm:w-5/6 md:w-4/6 lg:w-3/5 xl:w-2/3 2xl:w-1/2 h-auto p-10 shadow-2xl bg-white flex justify-center rounded-md">
        <form onSubmit={onSubmit} className="flex flex-col gap-5 w-full">
          {children}
        </form>
      </div>
    </div>
  );
};

export default FormContainer;
