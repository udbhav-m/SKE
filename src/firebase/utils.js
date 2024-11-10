import {
  runTransaction,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

import axios from "axios";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

export async function fetchGuideNames() {
  try {
    const guidesRef = collection(db, "guides");
    const guideDocs = await getDocs(guidesRef);

    if (!guideDocs.empty) {
      const guideData = guideDocs.docs[0].data(); // Access the first document
      const guideNames = guideData.guidename; // Retrieve the 'guidename' array
      return guideNames;
    } else {
      console.log("No documents found in the 'guides' collection.");
    }
  } catch (error) {
    console.error("Error fetching guide names:", error);
  }
}

export async function makePayment({ reqBodyData }) {
  try {
    const response = await axios.post(
      import.meta.env.VITE_MAKEPAY_API,
      reqBodyData,
      {
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );

    if (response.data.data?.success) {
      console.log(response.data.data);
      return response.data.data.BankRRN;
    } else {
      console.error("Payment unsuccessful:", response.data.data);
      return null;
    }
  } catch (error) {
    console.error("Error making payment:", error);
    return null;
  }
}

var attempt = 0;
const maxAttempts = 30;
var retryDelay = 3000;

export async function checkPayment(
  bankRRN,
  setStatus,
  userDocID,
  courseID,
  formData
) {
  try {
    const response = await axios.post(
      import.meta.env.VITE_LISTENPAY_API + bankRRN
    );
    setStatus(
      "UPI payment request sent. Please complete payment in your UPI app."
    );

    if (attempt === 4)
      setStatus(
        "Your payment request is pending. Please approve or decline in your UPI app."
      );
    if (attempt === 10)
      setStatus(
        "Still waiting for payment confirmation. Please complete the payment on your UPI app."
      );

    if (response.data.status === "Success") {
      setStatus("Almost there..");

      // Perform Firestore transaction to write the payment data along with other fields
      await handlePaymentTransaction(userDocID, courseID, formData);
      setStatus("Payment successful! Thank you for your purchase.");
      console.log("Payment successfully recorded.");
      setTimeout(() => setStatus(""), 10000);
    } else if (response.data.status === "Failure") {
      setStatus(
        "Your payment was declined. Please initiate the payment again if needed."
      );
      setTimeout(() => setStatus(""), 15000);
      console.log("Payment failed.");
    } else if (attempt < maxAttempts) {
      attempt += 1;
      retryDelay += 3000;
      setTimeout(
        () => checkPayment(bankRRN, setStatus, userDocID, courseID, formData),
        retryDelay
      );
      console.log("Waiting for payment confirmation...");
    } else {
      setStatus(
        "Payment status could not be confirmed. Please check your UPI app or contact our support."
      );
      setTimeout(() => setStatus(""), 10000);
      console.log("Payment failed after max attempts.");
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
    setTimeout(() => setStatus(""), 5000);
  }
}

// Function to handle Firestore transaction and prevent parallel writes
async function handlePaymentTransaction(userDocID, courseID, formData) {
  const userPaymentsRef = doc(
    db,
    "users",
    userDocID,
    "user_payments",
    courseID
  );

  // Start a Firestore transaction
  await runTransaction(db, async (transaction) => {
    const userPaymentDoc = await transaction.get(userPaymentsRef);

    // Check if the course already exists in user_payments
    if (userPaymentDoc.exists()) {
      throw new Error("This course has already been purchased.");
    }

    // If the course does not exist, write payment data with additional fields
    const emailphone = localStorage.getItem("emailphone");
    const name = localStorage.getItem("name");

    transaction.set(userPaymentsRef, {
      paymentDate: new Date().toISOString(),
      paymentStatus: "Completed", // Payment status
      paymentType: "UPI", // Payment type
      courseId: courseID, // Add the courseId
      emailphone: emailphone, // Add email or phone
      guide: formData.dasajiName, // Add the guide from formData
      name: name, // Add name from localStorage
      // Add any other necessary fields here
    });
  }).catch((error) => {
    console.error("Transaction failed:", error);
    throw error;
  });
}

export function generateUniqueIds() {
  const subMerchantId = uuidv4().replace(/-/g, ""); // Generates a unique subMerchantId
  const merchantTranId = uuidv4().replace(/-/g, ""); // Generates a unique merchantTranId
  const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Creates a unique billNumber

  return {
    subMerchantId,
    merchantTranId,
    billNumber,
  };
}

export function formatDate() {
  const addingFiveMinutes = new Date();
  addingFiveMinutes.setMinutes(addingFiveMinutes.getMinutes() + 5); // Adds 5 minutes
  const formattedDate = format(addingFiveMinutes, "dd/MM/yyyy hh:mm a");
  return formattedDate;
}
