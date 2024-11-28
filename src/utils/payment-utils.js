import {
  runTransaction,
  doc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import n2words from "n2words";
import axios from "axios";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { getCurrentTimestamp } from "./utils";

// Fetch guide names from the Firestore collection
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

// Make payment via the provided API
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

// Check payment status with retries
export async function checkPayment(
  bankRRN,
  setStatus,
  setError,
  userDocID,
  courseDetails,
  formData,
  navigate,
  userPaymentsRef
) {
  let attempt = 0;
  const maxAttempts = 30;
  const retryDelay = 3000; // 3 seconds delay
  let rrnSaved = false;

  try {
    while (attempt < maxAttempts) {
      const response = await axios.post(
        `${import.meta.env.VITE_LISTENPAY_API}${bankRRN}`
      );
      if (!rrnSaved) {
        await runTransaction(db, async (transaction) => {
          transaction.update(userPaymentsRef, {
            bankRRN: bankRRN, // Store the BankRRN
            paymentDate: new Date().toISOString(),
            updatedDate: new Date().toISOString(),
          });
        });
        rrnSaved = true;
      }

      if (response.data.status === "Success") {
        setStatus({ currentStatus: "Almost there..", title: "Success" });
        const receiptData = await handlePaymentTransaction(
          userDocID,
          courseDetails,
          formData
        );
        if (receiptData) {
          setStatus({ currentStatus: "Payment successful!", title: "Success" });
          console.log("Navigating to receipt with:", receiptData);
          navigate("/receipt", { state: { receiptData: receiptData } });
        }
        return true; // Exit loop and function if successful
      } else if (response.data.status === "Failure") {
        setStatus({
          currentStatus: "Payment declined. Please try again.",
          title: "Failed",
        });
        await handleFailedPayment(userDocID, courseDetails.id);
        setStatus({ currentStatus: "", title: "" });
        return false; // Exit loop on failure
      }

      // Update status during retries
      if (attempt === 4) {
        setStatus({
          currentStatus: "Still pending, please approve in your UPI app.",
          title: "Processing your payment..",
        });
      }
      if (attempt === 9) {
        setStatus({
          currentStatus:
            "Final attempt to confirm payment. Please check your UPI app.",
          title: "Processing your payment..",
        });
      }

      attempt++;
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }

    // Max attempts reached
    setStatus({
      currentStatus: "Payment status could not be confirmed. Contact support.",
      title: "Uh-oh..",
    });
    return false;
  } catch (error) {
    await runTransaction(db, async (transaction) => {
      transaction.update(userPaymentsRef, {
        bankRRN: bankRRN, // Store the BankRRN
        paymentDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
      });
    });
    console.error("Error checking payment status:", error);
    setStatus({ currentStatus: "", title: "" });
    setError(
      "A server error occurred. Please decline the payment request if prompted. "
    );
  }
}

// Handle payment transaction and Firestore updates
export async function handlePaymentTransaction(
  userDocID,
  courseDetails,
  formData
) {
  const userPaymentsRef = doc(
    db,
    "users",
    userDocID,
    "user_payments",
    courseDetails.id
  );
  const userDocRef = doc(db, "users", userDocID);
  const timeStamp = getCurrentTimestamp();
  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const receiptData = {
    paymentStatus: "Approved",
    paymentType: "UPI",
    courseId: courseDetails.id,
    courseName: courseDetails.name,
    dasajiName: formData.dasajiName,
    name: formData.name,
    receiptNumber: `KE-${courseDetails.invoiceCode}-${timeStamp}`,
    amount: formData.amount,
    amountInWords: n2words(formData.amount),
    paymentDate: formattedDate,
    address: `${formData.address}, ${formData.cityOrDist}, ${formData.state}, ${formData.country}, ${formData.pincode}`,
    aadharOrPan: formData.aadhar,
    emailphone: localStorage.getItem("email") || localStorage.getItem("phone"),
  };

  await runTransaction(db, async (transaction) => {
    const userPaymentDoc = await transaction.get(userPaymentsRef);
    const userDoc = await transaction.get(userDocRef);

    if (
      userPaymentDoc.exists() &&
      userPaymentDoc.data().paymentStatus === "Approved"
    ) {
      throw new Error("This course has already been purchased.");
    }

    transaction.set(userPaymentsRef, receiptData);

    const userData = userDoc.exists() ? userDoc.data() : {};
    const courses = userData.courses || [];
    if (!courses.includes(courseDetails.id)) {
      transaction.update(userDocRef, {
        courses: [...courses, courseDetails.id],
        emailphone:
          localStorage.getItem("email") || localStorage.getItem("phone"),
      });
    }
  });

  return receiptData;
}

// Handle failed payments
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
      if (paymentData.paymentStatus === "Pending") {
        transaction.update(userPaymentsRef, { paymentStatus: "Rejected" });
      }
    }
  }).catch((error) => {
    console.error("Failed payment transaction error:", error);
    throw error;
  });
}

// Generate unique IDs for transactions
export function generateUniqueIds() {
  const subMerchantId = uuidv4().replace(/-/g, "");
  const merchantTranId = uuidv4().replace(/-/g, "");
  const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    subMerchantId,
    merchantTranId,
    billNumber,
  };
}

// Format date for UPI payment expiry
export function formatDate() {
  const addingFiveMinutes = new Date();
  addingFiveMinutes.setMinutes(addingFiveMinutes.getMinutes() + 5);
  return format(addingFiveMinutes, "dd/MM/yyyy hh:mm a");
}
