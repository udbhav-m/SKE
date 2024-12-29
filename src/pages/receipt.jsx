import React, { useRef, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ArrowLeft } from "lucide-react";
import Loader from "../components/loader";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { db } from "../utils/firebaseConfig";

const Receipt = () => {
  const receiptRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { receiptData } = location.state || {};
  const [sent, setSent] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isEF, setEF] = useState(false);
  const [mailSent, setMailSent] = useState(false);

  const showNotification = (message) => {
    setSent(message);
    setIsVisible(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setSent(""), 300);
    }, 5000);
  };

  function capitalizeFirstLetter(sentence) {
    if (sentence.length === 0) {
      return sentence;
    }
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  const generatePDF = async (element) => {
    if (!element) return null;
  
    const a4Width = 595.28;
    const a4Height = 841.89;
    const margin = 20;

    // Create styles for different background colors
    const bgStyle = isEF ? 
      'rgba(76, 175, 80, 0.1)' :   // EF green with 0.1 opacity
      'rgba(255, 183, 117, 0.1)';  // Regular orange with 0.1 opacity
    
    const headerBgStyle = isEF ? 
      'rgba(76, 175, 80, 0.85)' :  // EF green with 0.85 opacity
      'rgba(255, 183, 117, 0.85)'; // Regular orange with 0.85 opacity

    // Add a style tag to handle backgrounds
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      .bg-opacity-custom {
        background-color: ${bgStyle} !important;
      }
      .header-bg-custom {
        background-color: ${headerBgStyle} !important;
      }
    `;
    document.head.appendChild(styleTag);

    // Add temporary classes to elements
    const headerDiv = element.querySelector('[class*="border-custom-brown"]');
    if (headerDiv) {
      headerDiv.classList.add('header-bg-custom');
    }

    const bgElements = element.querySelectorAll('[class*="bg-opacity-10"]');
    bgElements.forEach(el => {
      el.classList.add('bg-opacity-custom');
    });
  
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: true,
      scrollY: -window.scrollY,
      windowWidth: 1024,
      windowHeight: element.scrollHeight,
    });

    // Cleanup: remove temporary styles and classes
    styleTag.remove();
    if (headerDiv) {
      headerDiv.classList.remove('header-bg-custom');
    }
    bgElements.forEach(el => {
      el.classList.remove('bg-opacity-custom');
    });
  
    const availableWidth = a4Width - 2 * margin;
    const availableHeight = a4Height - 2 * margin;
    const imageWidth = canvas.width;
    const imageHeight = canvas.height;
    const scale = Math.min(
      availableWidth / imageWidth,
      availableHeight / imageHeight
    );
  
    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;
    const xPos = (a4Width - scaledWidth) / 2;
    const yPos = (a4Height - scaledHeight) / 2;
  
    const pdf = new jsPDF({
      unit: "pt",
      format: "a4",
      orientation: "portrait",
    });
  
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 1.0),
      "JPEG",
      xPos,
      yPos,
      scaledWidth,
      scaledHeight,
      undefined,
      "FAST"
    );
  
    return pdf;
};
  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePDF(receiptRef.current);
      if (!pdf) return;
      pdf.save(`receipt_${receiptData.receiptNumber}.pdf`);
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to download receipt. Please try again.");
    }
  };

  async function sendMail() {
    if (mailSent) return;  // Prevent duplicate sends
    
    try {
      const pdf = await generatePDF(receiptRef.current);
      if (!pdf) return;
      if (!receiptData.receiptNumber) return;

      const fileName = `receipts/${receiptData.receiptNumber}.pdf`;
      const storage = getStorage();
      const storageRef = ref(storage, fileName);
      const mailRef = doc(db, "mail", receiptData.receiptNumber);

      let pdfBase64;
      try {
        await getDownloadURL(storageRef);
        console.log("PDF already exists");
      } catch (error) {
        const pdfBlob = pdf.output("blob");
        await uploadBytesResumable(storageRef, pdfBlob);
        console.log("uploaded");
      }

      const mailDoc = await getDoc(mailRef);
      if (!mailDoc.exists()) {
        pdfBase64 = pdf.output("datauristring").split(",")[1];
        const foundationName = isEF ? 'Sri Amma Bhagavan Earth Foundation' : 'Sri Amma Bhagavan Foundation India';
        
        await setDoc(mailRef, {
          to: receiptData.email,
          message: {
            subject: `Receipt for ${receiptData.courseName} - ${foundationName}`,
            html: `
                <h4>Thank you for your payment</h4>
                <p>Dear ${receiptData.name},</p>
                <p>Please find attached your receipt for ${receiptData.courseName}.</p>
                <p>Amount paid: ₹${receiptData.amount}.00</p>
                <p>Receipt Number: ${receiptData.receiptNumber}</p>
                <br>
                <p>Best regards,</p>
                <p>${foundationName}</p>
              `,
            attachments: [
              {
                filename: `receipt_${receiptData.receiptNumber}.pdf`,
                content: pdfBase64,
                encoding: "base64",
                contentType: "application/pdf",
              },
            ],
          },
        });
        console.log("Mail created");
        showNotification("Sent receipt to your mail");
        setMailSent(true);  // Mark as sent
      } else {
        console.log("Mail already sent");
        showNotification("Sent the receipt to your mail already");
        setMailSent(true);  // Mark as sent even if it existed before
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
    }
  }

  useEffect(() => {
    if (receiptData) {
      const isEarthFoundation = Boolean(receiptData.EF);
      setEF(isEarthFoundation);
    }
  }, [receiptData]);

  useEffect(() => {
    if (receiptData && !mailSent) {
      const timer = setTimeout(() => {
        sendMail();
      }, 1000); // Give a small delay to ensure state is updated
      
      return () => clearTimeout(timer);
    }
  }, [isEF, receiptData, mailSent]);

  if (!receiptData) {
    return <Loader />;
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div
            className="cursor-pointer"
            onClick={() => navigate("/home#registered-events")}
          >
            <ArrowLeft className="h-6 w-6" />
          </div>
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Download Receipt
          </button>
        </div>

        <div
          id="receipt-container"
          ref={receiptRef}
          className="rounded-lg shadow-lg  border-4 bg-secondary bg-opacity-5"
          style={{ minHeight: "1000px" }}
        >
          {/* Header */}
          <div
            className={`flex justify-between items-center mb-12  border-b-4 bg-opacity-85 border-custom-brown  p-6 px-12 rounded-t-md  ${
              isEF ? "bg-[#4CAF50]" : "bg-primary"
            }`}
          >
            <div className="flex items-center text-center">
              <img
                src="AB.png"
                alt="Sri Amma Bhagavan Foundation India"
                className="h-16 mr-6"
              />
              <div className="text-xl font-serif">
                Sri Amma Bhagavan
                <br />
                {isEF ? "Earth Foundation" : "Foundation India"}
              </div>
            </div>
            <h1 className="text-5xl font-serif">Receipt</h1>
          </div>

          {/* Receipt Information */}
          <div
            className={`mb-12 p-2 border border-gray-200 rounded-lg bg-opacity-10  m-12 ${
              isEF ? "bg-[#4CAF50]" : "bg-primary"
            }`}
          >
            <h2 className="text-2xl font-medium pb-4 border-b border-gray-300  mb-6 ">
              Receipt Information
            </h2>
            <table className="w-full">
              <thead>
                <tr className="text-center border-b-2 border-gray-300">
                  <th className="pb-4 text-lg">Receipt No</th>
                  <th className="pb-4 text-lg">Date</th>
                  <th className="pb-4 text-lg">Event</th>
                  <th className="pb-4 text-lg">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center text-lg">
                  <td className="py-4">{receiptData?.receiptNumber || ""}</td>
                  <td className="py-4">{receiptData?.paymentDate || ""}</td>
                  <td className="py-4">{receiptData?.courseName || ""}</td>
                  <td className="py-4">₹ {receiptData?.amount || ""}.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-between mb-12 pb-6 border-b border-gray-200 m-12">
            <span className="text-gray-700 font-semibold">
              INR :{" "}
              {capitalizeFirstLetter(receiptData?.amountInWords) + " rupees" ||
                ""}
            </span>
            <div className="text-lg">
              <span className="font-medium">Total:</span>
              <span className="ml-4">₹ {receiptData?.amount || ""}.00</span>
            </div>
          </div>

          {/* Bill Information */}
          <div className="mb-12 m-12">
            <h2 className="text-2xl font-medium mb-6">Donor Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-gray-600 mb-2">Address</h3>
                <p className="font-semibold text-lg">{receiptData?.name}</p>
                <p className="text-lg">{receiptData?.fullAddress || " "}</p>
              </div>

              <div className="flex justify-between gap-8 pb-6 border-b border-gray-200">
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="text-gray-600 mb-1">Aadhar No</h3>
                    <p className="text-lg">{receiptData?.aadharOrPan || ""}</p>
                  </div>
                  <div>
                    <h3 className="text-gray-600 mb-1">PAN No</h3>
                    <p className="text-lg">{receiptData?.pan || ""}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <h3 className="text-gray-600 mb-1">Phone No</h3>
                    <p className="text-lg">{receiptData?.phone || ""}</p>
                  </div>
                  <div>
                    <h3 className="text-gray-600 mb-1">Email ID</h3>
                    <p className="text-lg">{receiptData?.email || ""}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div
            className={`flex justify-between mb-12 p-6 border border-gray-200 rounded-lg  bg-opacity-10  m-12 ${
              isEF ? "bg-[#4CAF50]" : "bg-primary"
            }`}
          >
            <div className="flex items-center">
              <img src="/success.svg" alt="Success" className="h-8 w-8 mr-4" />
              <span className="text-lg">
                Received with thanks from
                <br />
                <span className="font-medium">{receiptData?.name || ""}</span>
              </span>
            </div>
            <div className="border-l border-gray-300 pl-6">
              <span className="text-gray-600">
                UPI Transaction Reference No.
              </span>
              <br />
              <span className="text-lg font-medium">
                {receiptData?.paymentId || ""}
              </span>
              {receiptData?.merchantTranId && isEF && (
                <div>
                  <span className="text-gray-600 pt-1">Transaction ID</span>
                  <br />
                  <span className="text-lg font-medium">
                    {receiptData?.merchantTranId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Foundation Details */}
          <div className="mb-12 pb-6 border-b border-gray-200 m-12">
            <div>
              <h3 className="text-gray-600 mb-2">Address</h3>
              <p className="text-lg">
                {isEF
                  ? " Sri Amma Bhagavan Earth Foundation."
                  : " Sri Amma Bhagavan Foundation India"}
                <br />
                No 1, 2nd Cross, Domlur 2nd Stage, Bangalore- 560071
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="text-gray-600 space-y-3 pb-8 m-12">
            <h3 className="font-medium text-md mb-4">Terms And Conditions</h3>
            <p className="text-sm">
              We declare that the amount charged is for the services provided or
              to be provided as mentioned in the receipt & contents in the
              receipt are true & correct.
            </p>
            <p className="text-sm">
              Services rendered above are exempted from GST Vide notification no
              12/2227 of central tax (rate) under chapter 99.
            </p>
            <p className="pb-6 text-sm">
              This is a system generated receipt and hence no signature is
              required
            </p>
          </div>
        </div>
      </div>
      <div
        className={`
    fixed top-[80vh] left-[5vh] z-30
    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
    transition-all duration-300 ease-in-out
  `}
      >
        {sent && (
          <div className="bg-white flex items-center justify-center gap-3 p-3 rounded-md shadow-lg">
            <img src="success.svg" alt="" className="size-8" />
            <div>
              <strong>{sent}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Receipt;
