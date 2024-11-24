/* eslint-disable react/prop-types */
import React from "react";
export default function Button({ label, onClick }) {
  return (
    <div
      onClick={onClick}
      className="border p-2 bg-[#E5870D] text-white text-lg font-semibold cursor-pointer select-none rounded-lg"
    >
      {label}
    </div>
  );
}
