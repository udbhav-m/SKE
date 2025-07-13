import {
  runTransaction,
  doc,

  collection,
  getDocs,

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
  formData,
  navigate
) {
  try {
    console.log(bankRRN, userDocID, courseID, formData);
    setStatus({
      currentStatus:
        "UPI payment request sent. Please complete payment in your UPI app.",
      title: "Processing your payment..",
    });

    // Initial request to check payment status
    const response = await axios.post(
      import.meta.env.VITE_LISTENPAY_API + bankRRN
    );

    // Handling specific stages based on the retry attempts
    if (attempt === 4) {
      setStatus({
        currentStatus:
          "Your payment request is pending. Please approve or decline in your UPI app.",
        title: "Processing your payment..",
      });
    }
    if (attempt === 10) {
      setStatus({
        currentStatus:
          "Still waiting for payment confirmation. Please complete the payment on your UPI app.",
        title: "Processing your payment..",
      });
    }

    // If the payment was successful
    if (response.data.status === "Success") {
      setStatus({
        currentStatus: "Almost there..",
        title: "Success",
      });

      // Perform Firestore transaction to write the payment data along with other fields
      await handlePaymentTransaction(userDocID, courseID, formData);
      setStatus({
        currentStatus: "Payment successful!",
        title: "Success",
      });
      console.log("Payment successfully recorded.");
      
      // Timeout to reset the status after showing the success message
      setTimeout(() => {
        navigate("/home#registered-events")
        setStatus({ currentStatus: "", title: "" });
      }, 10000);
    } else if (response.data.status === "Failure") {
      // Handle failed payment
      setStatus({
        currentStatus:
          "Your payment was declined. Please initiate the payment again if needed.",
        title: "Failed",
      });

      // Timeout to reset the status after showing the failure message
      setTimeout(() => {
        setStatus({ currentStatus: "", title: "" });
      }, 10000);
      
      console.log("Payment failed.");
      
      // Handle failed payment transaction (to reset any state or mark as failed)
      await handleFailedPayment(userDocID, courseID, formData);

    } else if (attempt < maxAttempts) {
      // Retry logic if the payment is not confirmed and max attempts are not reached
      attempt += 1;
      retryDelay += 3000; // Incremental delay between retries

      setTimeout(
        () => checkPayment(bankRRN, setStatus, userDocID, courseID, formData),
        retryDelay
      );
      console.log("Waiting for payment confirmation...");
    } else {
      // If maximum attempts are reached and payment status is not confirmed
      setStatus({
        currentStatus:
          "Payment status could not be confirmed. Please check your UPI app or contact our support.",
        title: "",
      });
      
      // Timeout to reset the status after the message is shown
      setTimeout(() => {
        setStatus({ currentStatus: "", title: "" });
      }, 10000);
      console.log("Payment failed after max attempts.");
      
      // No need to mark as "Failed" here, as the max attempts are exhausted but not an actual failure
    }
  } catch (error) {
    console.error("Error checking payment status:", error);

    // Timeout to reset the status after an error occurs
    setTimeout(() => {
      setStatus({ currentStatus: "", title: "" });
    }, 10000);
  }
}

// Function to handle Firestore transaction and prevent parallel writes
export async function handlePaymentTransaction(userDocID, courseID, formData) {
  const userPaymentsRef = doc(db, "users", userDocID, "user_payments", courseID);
  const userDocRef = doc(db, "users", userDocID);

  await runTransaction(db, async (transaction) => {
    // First, get all the necessary data before performing any writes
    const userPaymentDoc = await transaction.get(userPaymentsRef);
    const userDoc = await transaction.get(userDocRef);

    // Check if the course has already been purchased (payment status Completed)
    if (userPaymentDoc.exists() && userPaymentDoc.data().paymentStatus === "Approved") {
      throw new Error("This course has already been purchased.");
    }

    // If the course was previously in "Pending" status, reset the status
    if (userPaymentDoc.exists() && userPaymentDoc.data().paymentStatus === "Pending") {
      transaction.update(userPaymentsRef, { paymentStatus: "Pending" }); // Reset to Pending
    }

    // After all reads, perform writes
    const emailphone = localStorage.getItem("emailphone");
    const name = localStorage.getItem("name");

    // Set payment data in Firestore
    transaction.set(userPaymentsRef, {
      paymentDate: new Date().toISOString(),
      paymentStatus: "Approved", // Payment status
      paymentType: "UPI", // Payment type
      courseId: courseID, // Add the courseId
      emailphone: emailphone, // Add email or phone
      guide: formData.dasajiName, // Add the guide from formData
      name: name, // Add name from localStorage
    });

    // Handle courses update in the user document
    if (userDoc.exists()) {
      const courses = userDoc.data()?.courses ? userDoc.data().courses : [];
      if (!courses.includes(courseID)) {
        courses.push(courseID);
        transaction.update(userDocRef, { courses: courses });
      }
    } else {
      transaction.set(userDocRef, { courses: [courseID] });
    }
  }).catch((error) => {
    console.error("Transaction failed:", error);
    throw error;
  });
}



export async function handleFailedPayment(userDocID, courseID) {
  const userPaymentsRef = doc(
    db,
    "users",
    userDocID,
    "user_payments",
    courseID
  );

  await runTransaction(db, async (transaction) => {
    const userPaymentDoc = await transaction.get(userPaymentsRef);

    if (userPaymentDoc.exists()) {
      const paymentData = userPaymentDoc.data();
      // If payment status is still "Pending", we mark it as "Failed"
      if (paymentData.paymentStatus === "Pending") {
        transaction.update(userPaymentsRef, { paymentStatus: "Failed" });
      }
    }
  }).catch((error) => {
    console.error("Failed payment transaction error:", error);
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
