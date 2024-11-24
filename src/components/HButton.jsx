/* eslint-disable react/prop-types */

import React from "react";
export default function HButton({ label, onClick }) {
  return (
    <>
      <div
        className="p-2 px-4 font-medium bg-primary bg-opacity-60 hover:bg-primary flex justify-center rounded-full hover:cursor-pointer select-none transition-all duration-200 min-w-fit "
        onClick={onClick}
      >
        <h1>{label}</h1>
      </div>
    </>
  );
}
