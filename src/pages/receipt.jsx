import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { ArrowLeft } from "lucide-react";

const Receipt = () => {
  const receiptRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { receiptData } = location.state || {}; // Get the passed data
  console.log("receipt",receiptData);

  const handleDownloadPDF = () => {
    const element = receiptRef.current;
    html2pdf()
      .from(element)
      .set({
        margin: 0.5,
        filename: `receipt_${receiptData.courseId}.pdf`,
        image: { type: "png", quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  return (
    <>
      <div className=" mt-6 flex items-center justify-around">
        <div className="w-fit hover:cursor-pointer h-fit" onClick={() => navigate("/home")}>
          <ArrowLeft />
        </div>
        <button
          onClick={handleDownloadPDF}
          className="m-4 align-self-center px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Invoice
        </button>
      </div>
      <div className="  max-w-2xl mx-auto p-8 bg-white" ref={receiptRef}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/AB.png?alt=media&token=15eb34e1-18f5-4fa5-8d67-c82d23e5d6ab"
              alt="Sri Amma Bhagavan Foundation India"
              className="h-14 mr-4"
            />
            <div className="text-lg font-serif">
              Sri Amma Bhagavan
              <br />
              Foundation India
            </div>
          </div>
          <h1 className="text-4xl font-serif">Invoice</h1>
        </div>

        {/* Receipt Information */}
        <div className="mb-8">
          <h2 className="text-xl font-medium pb-4 border-b border-gray-200 mb-4">
            Receipt Information
          </h2>
          <table className="w-full">
            <thead>
              <tr className="text-center border-b border-gray-200">
                <th className="pb-2">Receipt No</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Participant Name</th>
                <th className="pb-2">Event</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2">INVM2024-2025000012</td>
                <td>{receiptData.paymentDate}</td>
                <td>{receiptData.name}</td>
                <td>{receiptData.courseName}</td>
                <td>{receiptData.amount}.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-8 pb-4 border-b border-gray-200">
          {/* <span className="text-gray-600">Fifty Thousand</span> */}
          <div>
            <span className="font-medium">Total:</span>
            <span className="ml-4">Rs. {receiptData.amount}.00</span>
          </div>
        </div>

        {/* Bill Information */}
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Bill Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-sm text-gray-600 mb-1">Address</h3>
              <p>
                {receiptData.address || "Alt address"}
                <br />
                {receiptData.address || "Alt address"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm text-gray-600 mb-1">PAN No</h3>
                <p>{receiptData.pan || "dummy PAN"}</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <h3 className="text-sm text-gray-600 mb-1">Phone No</h3>
                <p>{receiptData.address || "dummy number"}1</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <h3 className="text-sm text-gray-600 mb-1">Email ID</h3>
                <p>{receiptData.emailphone || "dummy address"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="flex justify-between mb-8 p-4 border border-gray-200 rounded">
          <div className="flex items-center">
            <img src="/success.svg" alt="Success" className="h-6 w-6 mr-2" />
            <span>
              Received from
              <br />
              {receiptData.name}
            </span>
          </div>
          <div className="border-l border-gray-200 pl-4">
            <span className="text-sm text-gray-600">
              UPI Transaction Reference On.
            </span>
            <br />
            <span>{receiptData.refNo || "dummy ref number"}</span>
          </div>
        </div>

        {/* Foundation Details */}
        <div className="grid gap-4 mb-8 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-sm text-gray-600 mb-1">Address</h3>
            <p>
              Sri Amma Bhagavan Foundation India.
              <br />
               No 1, 2nd Cross, Domlur 2nd Stage, Bangalore- 560071
            </p>
          </div>
          {/* <div className="border-l border-gray-200 pl-4">
            <h3 className="text-sm text-gray-600 mb-1">PAN No</h3>
            <p>ADYPD7155N</p>
          </div> */}
        </div>

        {/* Terms and Conditions */}
        <div className="text-xs text-gray-600 space-y-1">
          <h3 className="font-medium">Terms And Conditions</h3>
          <p>
            We Declare That The Amount Charged Is For The Services Provided Or
            To Be Provided As Mentioned In The Invoice & Contents in The Invoice
            Are True & Correct.
          </p>
          <p>
            Services Rendered Above Are Exempted from GST Vide Notification No
            12/2227 Of Central Tax (Rate) Under Chapter 99.
          </p>
          <p>
            This Is A System Generated Receipt And Hence No Signature Is
            Required
          </p>
        </div>
      </div>
    </>
  );
};

export default Receipt;
