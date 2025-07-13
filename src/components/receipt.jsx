import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";

const Receipt = () => {
  const receiptRef = useRef();
  const location = useLocation();
  const { receiptData } = location.state || {}; // Get the passed data

  const handleDownloadPDF = () => {
    const element = receiptRef.current;
    html2pdf()
      .from(element)
      .set({
        margin: 1,
        filename: `receipt_${receiptData.courseId}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
      })
      .save();
  };

  console.log(receiptData.updatedDate)

  return (
    <div className="p-6 bg-white border border-gray-300 shadow-lg w-4/5 mx-auto">
      <div ref={receiptRef} className="p-4">
        {" "}
        {/* Add padding to the main container */}
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <img
            src="https://res.cloudinary.com/dkakfpolz/image/upload/v1730783242/ab/qeiyh0rpdyddi9xioard.png"
            alt="Sri Amma Bhagavan Foundation Logo"
            className="w-24"
          />
          <div className="text-right">
            <h2 className="text-xl font-bold">
              Sri Amma Bhagavan Foundation India
            </h2>
            <p>No. 1, 2nd Cross, Domlur 2nd Stage, Bangalore - 560071</p>
          </div>
        </div>
        {/* Invoice Information Section */}
        <div className="mb-6 p-4 border border-gray-300 rounded-lg">
          {" "}
          {/* Added rounded corners */}
          <h3 className="mb-4 text-lg font-semibold">Invoice Information</h3>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border p-3">
                  <strong>Course ID:</strong>
                </td>
                <td className="border p-3">{receiptData.courseId}</td>
                <td className="border p-3">
                  <strong>Date of Registration:</strong>
                </td>
                <td className="border p-3">{receiptData.paymentDate}</td>
              </tr>
              <tr>
                <td className="border p-3">
                  <strong>Bill To:</strong>
                </td>
                <td className="border p-3">{receiptData.name}</td>
                <td className="border p-3">
                  <strong>Email/Phone:</strong>
                </td>
                <td className="border p-3">{receiptData.emailphone}</td>
              </tr>
              <tr>
                <td className="border p-3">
                  <strong>Dasaji Name:</strong>
                </td>
                <td className="border p-3">{receiptData.dasajiName}</td>
                <td className="border p-3">
                  <strong>Guide:</strong>
                </td>
                <td className="border p-3">{receiptData.guide}</td>
              </tr>
              <tr>
                <td className="border p-3">
                  <strong>Payment ID:</strong>
                </td>
                <td className="border p-3">{receiptData.paymentId}</td>
                <td className="border p-3">
                  <strong>Payment Status:</strong>
                </td>
                <td className="border p-3">{receiptData.paymentStatus}</td>
              </tr>
              {/* <tr>
                <td className="border p-3">
                  <strong>Updated Date:</strong>
                </td>
                <td className="border p-3" colSpan="3">
                  {receiptData.updatedDate}
                </td>
              </tr> */}
            </tbody>
          </table>
        </div>
        {/* Terms Section */}
        <p className="text-sm mt-4 border-t border-gray-300 pt-4">
          * We declare that the amount charged is for the services provided or
          to be provided as mentioned in the invoice and contents in the invoice
          are true and correct. Services are exempted from GST. This is a
          computer-generated invoice. No signature required.
        </p>
      </div>
      <button
        onClick={handleDownloadPDF}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Download PDF
      </button>
    </div>
  );
};

export default Receipt;
