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


const showNotification = (message) => {
  setSent(message);
  setIsVisible(true);
  setTimeout(() => {
    setIsVisible(false);
    setTimeout(() => setSent(""), 300);
  }, 5000);
};

  const generatePDF = async (element) => {
    if (!element) return null;

    const a4Width = 595.28;
    const a4Height = 841.89;
    const margin = 20;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: -window.scrollY,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(element.id);
        if (clonedElement) {
          clonedElement.style.width = `${element.offsetWidth}px`;
          clonedElement.style.height = `${element.offsetHeight}px`;
        }
      },
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
    try {
      const pdf = await generatePDF(receiptRef.current);
      if (!pdf) return;
      if (!receiptData.receiptNumber) return;

      const fileName = `receipts/${receiptData.receiptNumber}.pdf`;
      const storage = getStorage();
      const storageRef = ref(storage, fileName);
      const mailRef = doc(db, "mail", receiptData.receiptNumber);

      // Check if PDF exists in storage
      let pdfBase64;
      try {
        await getDownloadURL(storageRef);
        console.log("PDF already exists in storage");
      } catch (error) {
        // PDF doesn't exist, upload it
        const pdfBlob = pdf.output("blob");
        await uploadBytesResumable(storageRef, pdfBlob);
        console.log("PDF uploaded to storage");
      }

      // Check if mail document exists
      const mailDoc = await getDoc(mailRef);
      if (!mailDoc.exists()) {
        pdfBase64 = pdf.output("datauristring").split(",")[1];
        await setDoc(mailRef, {
          to: receiptData.email,
          message: {
            subject: `Receipt for ${receiptData.courseName}`,
            html: `
                <h4>Thank you for your payment</h4>
                <p>Dear ${receiptData.name},</p>
                <p>Please find attached your receipt for ${receiptData.courseName}.</p>
                <p>Amount paid: ₹${receiptData.amount}.00</p>
                <p>Receipt Number: ${receiptData.receiptNumber}</p>
                <br>
                <p>Best regards,</p>
                <p>Sri Amma Bhagavan Foundation India</p>
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
        console.log("Mail document created");
        showNotification("Sent receipt to your mail")
      } else {
        console.log("Mail already sent for this receipt");
        showNotification("Sent the receipt to your mail already")
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
    }
  }

  useEffect(() => {
    sendMail();
  }, []);

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
          className="bg-white rounded-lg shadow-lg p-12"
          style={{ minHeight: "1000px" }}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-12 pb-6 border-b border-gray-200">
            <div className="flex items-center text-center">
              <img
                src="AB.png"
                alt="Sri Amma Bhagavan Foundation India"
                className="h-16 mr-6"
              />
              <div className="text-xl font-serif">
                Sri Amma Bhagavan
                <br />
                Foundation India
              </div>
            </div>
            <h1 className="text-5xl font-serif">Receipt</h1>
          </div>

          {/* Receipt Information */}
          <div className="mb-12">
            <h2 className="text-2xl font-medium pb-4 border-b border-gray-200 mb-6">
              Receipt Information
            </h2>
            <table className="w-full">
              <thead>
                <tr className="text-center border-b-2 border-gray-200">
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
          <div className="flex justify-between mb-12 pb-6 border-b border-gray-200">
            <span className="text-gray-700 font-semibold">
              {receiptData?.amountInWords?.toUpperCase() + " RUPEES" || ""}
            </span>
            <div className="text-lg">
              <span className="font-medium">Total:</span>
              <span className="ml-4">₹ {receiptData?.amount || ""}.00</span>
            </div>
          </div>

          {/* Bill Information */}
          <div className="mb-12">
            <h2 className="text-2xl font-medium mb-6">Donor Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="pb-6 border-b border-gray-200">
                <h3 className="text-gray-600 mb-2">Address</h3>
                <p className="font-semibold text-lg">{receiptData?.name}</p>
                <p className="text-lg">{receiptData?.fullAddress || " "}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pb-6 border-b border-gray-200">
                <div>
                  <h3 className="text-gray-600 mb-2">PAN No</h3>
                  <p className="text-lg">{receiptData?.pan || ""}</p>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-2">Aadhar No</h3>
                  <p className="text-lg">{receiptData?.aadharOrPan || ""}</p>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-2">Phone No</h3>
                  <p className="text-lg">{receiptData?.phone || ""}</p>
                </div>
                <div>
                  <h3 className="text-gray-600 mb-2">Email ID</h3>
                  <p className="text-lg">{receiptData?.email || ""}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="flex justify-between mb-12 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center">
              <img src="/success.svg" alt="Success" className="h-8 w-8 mr-4" />
              <span className="text-lg">
                Received with thanks from
                <br />
                <span className="font-medium">{receiptData?.name || ""}</span>
              </span>
            </div>
            <div className="border-l border-gray-200 pl-6">
              <span className="text-gray-600">
                UPI Transaction Reference No.
              </span>
              <br />
              <span className="text-lg font-medium">
                {receiptData?.paymentId || ""}
              </span>
            </div>
          </div>

          {/* Foundation Details */}
          <div className="mb-12 pb-6 border-b border-gray-200">
            <div>
              <h3 className="text-gray-600 mb-2">Address</h3>
              <p className="text-lg">
                Sri Amma Bhagavan Foundation India.
                <br />
                No 1, 2nd Cross, Domlur 2nd Stage, Bangalore- 560071
              </p>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="text-gray-600 space-y-3 pb-8">
            <h3 className="font-medium text-lg mb-4">Terms And Conditions</h3>
            <p>
              We Declare That The Amount Charged Is For The Services Provided Or
              To Be Provided As Mentioned In The Receipt & Contents in The
              Receipt Are True & Correct.
            </p>
            <p>
              Services Rendered Above Are Exempted from GST Vide Notification No
              12/2227 Of Central Tax (Rate) Under Chapter 99.
            </p>
            <p className="pb-6">
              This Is A System Generated Receipt And Hence No Signature Is
              Required
            </p>
          </div>
        </div>
      </div>
      <div
  className={`
    fixed top-[80vh] left-[5vh] z-30
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
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
