/* eslint-disable react/prop-types */
import React from "react";
function BottomText({ onClick, label, to }) {
  return (
    <>
      <h1 className="text-sm">
        {label}
        <b className="cursor-pointer" onClick={onClick}>
          {to}
        </b>
      </h1>
    </>
  );
}

export default BottomText;
