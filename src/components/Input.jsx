/* eslint-disable react/prop-types */
import React from "react";
function Input({ label, type, placeholder, onChange }) {
  return (
    <>
      <div className="text-start space-y-2">
        <h1 className="font-medium text-lg">{label}</h1>
        <input
          className="rounded-md border w-80 p-2 "
          onChange={onChange}
          type={type}
          placeholder={placeholder}
        />
      </div>
    </>
  );
}

export default Input;
