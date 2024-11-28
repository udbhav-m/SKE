import React, { useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { ArrowLeft } from "lucide-react";
import Loader from "../components/loader";
import { doc, getDoc, setDoc } from "firebase/firestore"; 
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db } from "../utils/firebaseConfig";


const Receipt = () => {
  const receiptRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();
  const { receiptData } = location.state || {}; // Get the passed data
  console.log("receipt", receiptData);

  const handleDownloadPDF = () => {
    const element = receiptRef.current;
    html2pdf()
      .from(element)
      .set({
        margin: 0.5,
        filename: `receipt_${receiptData.receiptNumber}.pdf`,
        image: { type: "png", quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  useEffect(() => {
    if (receiptData.receiptNumber) {
      const generateAndPushPDFBlob = async () => {
        try {
          // Step 1: Create a new jsPDF instance with A4 page size (595x842)
          const docjs = new jsPDF('p', 'px', [595, 842]); // A4 size in px
      
          // Step 2: Set margins and content dimensions
          const marginX = 10;
          const marginY = 10;
          const pageWidth = 595;
          const pageHeight = 842;
          const contentWidth = pageWidth - 2 * marginX; // Subtracting margins
          const contentHeight = pageHeight - 2 * marginY; // Subtracting margins
      
          // Step 3: Add content to the PDF (directly from HTML)
          const content = receiptRef.current; // The HTML element you want to convert
          const canvas = await html2canvas(content);
          const imgData = canvas.toDataURL("image/png");
      
          // Step 4: Calculate the appropriate scale for the content to fit within the page
          const contentHeightInPixels = canvas.height;
          const contentWidthInPixels = canvas.width;
      
          // Calculate scale based on the height of the content and available page height
          const scaleHeight = contentHeightInPixels > contentHeight ? contentHeight / contentHeightInPixels : 1;
          const scaleWidth = contentWidthInPixels > contentWidth ? contentWidth / contentWidthInPixels : 1;
      
          // Choose the smaller scale factor to ensure content fits both width and height
          const scale = Math.min(scaleHeight, scaleWidth);
      
          // Step 5: Calculate the center position to place the image on the PDF
          const centerX = (pageWidth - contentWidth * scale) / 2; // Horizontal centering
          const centerY = (pageHeight - contentHeight * scale) / 2; // Vertical centering
      
          // Step 6: Add the image to the PDF at the calculated center position
          docjs.addImage(imgData, "PNG", centerX, centerY, contentWidth * scale, contentHeight * scale);
      
          // Step 7: Generate the PDF Blob
          const pdfBlob = docjs.output("blob");
      
          // Step 8: Firebase Storage reference for checking existing file
          const storage = getStorage();
          const storageRef = ref(storage, `receipts/${receiptData.receiptNumber}.pdf`);
      
          try {
            // Step 9: Check if the file already exists in Firebase Storage
            const existingFileURL = await getDownloadURL(storageRef);
      
            // If the file exists, skip the upload and proceed with Firestore update
            console.log("File already exists in Storage:", existingFileURL);
      
            // Firestore document reference for mail collection
            const firestoreDocRef = doc(db, "mail", receiptData.receiptNumber); // Unique doc based on receipt number
            const mailDoc = await getDoc(firestoreDocRef);
      
            if (mailDoc.exists()) {
              console.log("Email already sent for this receipt.");
              return;
            }
      
            // If document doesn't exist, push the existing PDF URL to Firestore
            await setDoc(firestoreDocRef, {
              message: `Namaste, <br/>Please find attached receipt for the course: <b>${receiptData.courseName}</b> on the date: <b>${receiptData.paymentDate}</b>.<br/><br/>Thank you.`,
              attachments: [
                {
                  content: existingFileURL, // Store the download URL
                  filename: `receipt_${receiptData.receiptNumber}.pdf`, // Set the filename based on receipt number
                  html: `Namaste, <br/>Please find attached receipt for the course: <b>${receiptData.courseName}</b> on the date: <b>${receiptData.paymentDate}</b>.<br/><br/>Thank you.`,
                  subject: "Receipt for Your Payment",
                },
              ],
              to: [receiptData.email], // Send to the email from receiptData
              createdAt: new Date(),
            });
      
            console.log("PDF already exists, URL pushed to Firestore.");
          } catch (error) {
            // If the file does not exist, upload the new PDF
            console.log("File does not exist, uploading new PDF.");
      
            // Step 10: Upload the new PDF Blob to Firebase Storage
            const uploadTask = uploadBytesResumable(storageRef, pdfBlob);
      
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                // Optional: Show upload progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload is " + progress + "% done");
              },
              (error) => {
                console.error("Error uploading file:", error);
              },
              async () => {
                // Step 11: Get the download URL after successful upload
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      
                // Step 12: Firestore document reference for mail collection
                const firestoreDocRef = doc(db, "mail", receiptData.receiptNumber);
                const mailDoc = await getDoc(firestoreDocRef);
      
                if (mailDoc.exists()) {
                  console.log("Email already sent for this receipt.");
                  return;
                }
      
                // Push the new PDF URL to Firestore
                await setDoc(firestoreDocRef, {
                  message: `Namaste, <br/>Please find attached receipt for the course: <b>${receiptData.courseName}</b> on the date: <b>${receiptData.paymentDate}</b>.<br/><br/>Thank you.`,
                  attachments: [
                    {
                      content: downloadURL, // Store the download URL
                      filename: `receipt_${receiptData.receiptNumber}.pdf`,
                      html: `Namaste, <br/>Please find attached receipt for the course: <b>${receiptData.courseName}</b> on the date: <b>${receiptData.paymentDate}</b>.<br/><br/>Thank you.`,
                      subject: "Receipt for Your Payment",
                    },
                  ],
                  to: [receiptData.email], // Send to the email from receiptData
                  createdAt: new Date(),
                });
      
                console.log("PDF successfully uploaded to Firebase Storage and URL pushed to Firestore.");
              }
            );
          }
        } catch (error) {
          console.error("Error generating or pushing PDF blob to mail collection:", error);
        }
      };
      
      generateAndPushPDFBlob();
    }
  }, [receiptData]);

  if (!receiptData) {
    console.log("No receipt data found!");
    return <Loader />;
  }
  return (
    <>
      <div className=" mt-6 flex items-center justify-around">
        <div
          className="w-fit hover:cursor-pointer h-fit"
          onClick={() => navigate("/home#registered-events")}
        >
          <ArrowLeft />
        </div>
        <button
          onClick={handleDownloadPDF}
          className="m-4 align-self-center px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Receipt
        </button>
      </div>
      <div className="  max-w-2xl mx-auto p-8 bg-white" ref={receiptRef}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div className="flex items-center text-center">
            <img
              src="AB.png"
              alt="Sri Amma Bhagavan Foundation India"
              className="h-14 mr-4"
            />
            <div className="text-lg font-serif">
              Sri Amma Bhagavan
              <br />
              Foundation India
            </div>
          </div>
          <h1 className="text-4xl font-serif">Receipt</h1>
        </div>

        {/* Receipt Information */}
        <div className="mb-8">
          <h2 className="text-xl font-medium pb-4 border-b border-gray-200 mb-4">
            Receipt Information
          </h2>
          <table className="w-full">
            <thead>
              <tr className=" text-center border-b border-gray-200">
                <th className="pb-2">Receipt No</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Donor Name</th>
                <th className="pb-2">Event</th>
                <th className="pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 text-sm">
                <td className="py-2">
                  {receiptData?.receiptNumber || ""}
                </td>
                <td>{receiptData?.paymentDate || ""}</td>
                <td>{receiptData?.name || ""}</td>
                <td>{receiptData?.courseName || ""}</td>
                <td> ₹ {receiptData?.amount || ""}.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="flex justify-between mb-8 pb-4 border-b border-gray-200">
          <span className="text-gray-700 font-semibold text-sm">
            {receiptData?.amountInWords?.toUpperCase()  + " RUPEES" || "" }
          </span>
          <div>
            <span className="font-medium">Total:</span>
            <span className="ml-4">
            ₹ {receiptData?.amount || ""}.00
            </span>
          </div>
        </div>

        {/* Bill Information */}
        <div className="mb-8">
          <h2 className="text-xl font-medium mb-4">Donor Information</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="pb-4 border-b border-gray-200">
              <h3 className="text-sm text-gray-600 mb-1">Address</h3>
              <p>{receiptData?.address || " "}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-sm text-gray-600 mb-1">PAN No</h3>
                <p>{receiptData?.pan || ""}</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <h3 className="text-sm text-gray-600 mb-1 ">Aadhar No</h3>
                <p>{receiptData?.aadhar || ""}</p>
              </div>
              <div className="">
                <h3 className="text-sm text-gray-600 mb-1">Phone No</h3>
                <p>{receiptData?.phone || ""}</p>
              </div>
              <div className="border-l border-gray-200 pl-4">
                <h3 className="text-sm text-gray-600 mb-1">Email ID</h3>
                <p>{receiptData?.email || ""}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="flex justify-between mb-8 p-4 border border-gray-200 rounded">
          <div className="flex items-center">
            <img src="/success.svg" alt="Success" className="h-6 w-6 mr-2" />
            <span>
              Received with thanks from
              <br />
              {receiptData?.name || ""}
            </span>
          </div>
          <div className="border-l border-gray-200 pl-4">
            <span className="text-sm text-gray-600">
              UPI Transaction Reference On.
            </span>
            <br />
            <span>{receiptData?.receiptNumber || ""}</span>
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
          We Declare That The Amount Charged Is For The Services Provided Or To Be Provided As Mentioned In The Receipt
          & Contents in The Receipt Are True & Correct.
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
