// payment-utils.js
import {
  runTransaction,
  doc,
  collection,
  getDocs,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import axios from "axios";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

const RETRY_CONFIG = {
  MAX_ATTEMPTS: 105,
  DELAY: 3000,
  STATUS_MESSAGES: {
    60: {
      currentStatus: "Still pending, please approve in your UPI app.",
      title: "Processing your payment..",
    },
    99: {
      currentStatus:
        "Final attempt to confirm payment. Please check your UPI app.",
      title: "Processing your payment..",
    },
  },
};

export async function fetchGuideNames() {
  try {
    const guideDocs = await getDocs(collection(db, "guides"));
    const firstDoc = guideDocs.docs[0];
    let guideNames = firstDoc?.data()?.guidename || [];

    const namesToRemove = [
      "Nivedana Dasa",
      "Adya Dasa",
      "Divi Dasa",
      "Pradeep Dasa",
      "Purna Dasa",
      "Sumitra Dasa",
      "Suvrata Dasa",
      "Vandana Dasa",
      "Vijaya Kumar Dasa",
      "Vishishita Dasa",
      "Ambica Dasa",
      "Anupama Dasa",
      "Indira Dasa",
      "Kanchan Dasa",
    ];

    // Filter out the specified names
    guideNames = guideNames.filter((name) => !namesToRemove.includes(name));

    return guideNames;
  } catch (error) {
    console.error("Error fetching guide names:", error);
    return [];
  }
}

export async function makePayment({ reqBodyData, courseDetails }) {
  try {
    const paymentApiUrl =
      courseDetails?.EF
        ? import.meta.env.VITE_EF_MAKEPAY_API
        : import.meta.env.VITE_MAKEPAY_API;
    const { data } = await axios.post(paymentApiUrl, reqBodyData, {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
    return data.data?.success ? data.data.BankRRN : null;
  } catch (error) {
    console.error("Error making payment:", error);
    return null;
  }
}

export async function checkPayment(
  bankRRN,
  setStatus,
  setError,
  userDocID,
  courseDetails,
  navigate,
  userPaymentsRef
) {
  let attempt = 0;

  const updatePaymentRef = async () => {
    await runTransaction(db, async (transaction) => {
      transaction.update(userPaymentsRef, {
        paymentId: bankRRN,
        updatedDate: Timestamp.fromDate(new Date()),
      });
    });
  };

  try {
    while (attempt < RETRY_CONFIG.MAX_ATTEMPTS) {
      const { data } = await axios.get(
        `${import.meta.env.VITE_CHECKPAY_API}${bankRRN}`
      );
      console.log(data?.data?.txnStatus);

      if (attempt === 0) await updatePaymentRef();

      const txnStatus = data?.data?.txnStatus.toUpperCase();

      if (txnStatus === "SUCCESS") {
        setStatus({ currentStatus: "Almost there..", title: "Success" });
        console.log(data?.data?.receiptSerialNo);
        const receiptData = await handlePaymentTransaction(
          userDocID,
          courseDetails,
          data?.data?.receiptSerialNo
        );

        if (receiptData) {
          setStatus({ currentStatus: "Payment successful!", title: "Success" });
          navigate("/receipt", { state: { receiptData } });
        }
        return true;
      }

      if (txnStatus === "FAILURE") {
        setStatus({
          currentStatus: "Payment declined. Please try again.",
          title: "Failed",
        });
        await handleFailedPayment(userDocID, courseDetails.id);
        await new Promise((resolve) => setTimeout(resolve, 5000));
        setStatus({ currentStatus: "", title: "" });
        return false;
      }

      const statusMessage = RETRY_CONFIG.STATUS_MESSAGES[attempt];
      if (statusMessage) setStatus(statusMessage);

      attempt++;
      await new Promise((resolve) => setTimeout(resolve, RETRY_CONFIG.DELAY));
    }

    setStatus({
      currentStatus: "Payment status could not be confirmed. Contact support.",
      title: "Uh-oh..",
    });
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setStatus({ currentStatus: "", title: "" });
    return false;
  } catch (error) {
    await updatePaymentRef();
    await handleFailedPayment(userDocID, courseDetails.id);
    console.error("Error checking payment status:", error);
    setStatus({ currentStatus: "", title: "" });
    setError(
      "A server error occurred. Please decline the payment request if prompted. "
    );
    return false;
  }
}

export async function handlePaymentTransaction(
  userDocID,
  courseDetails,
  receiptSerialNo
) {
  const userPaymentsRef = doc(
    db,
    "users",
    userDocID,
    "user_payments",
    courseDetails.id
  );
  const userDocRef = doc(db, "users", userDocID);

  await runTransaction(db, async (transaction) => {
    const [userPaymentDoc, userDoc] = await Promise.all([
      transaction.get(userPaymentsRef),
      transaction.get(userDocRef),
    ]);

    if (
      userPaymentDoc.exists() &&
      userPaymentDoc.data().paymentStatus === "Approved"
    ) {
      transaction.update(userPaymentsRef, {
        paymentStatus: "Approved",
        updatedDate: Timestamp.fromDate(new Date()),
        receiptNumber: `KE-${courseDetails.invoiceCode}-${receiptSerialNo}`,
      });
      console.error(
        "This course has already been purchased. probably updated by function"
      );
      return;
    }

    transaction.update(userPaymentsRef, {
      paymentStatus: "Approved",
      updatedDate: Timestamp.fromDate(new Date()),
      receiptNumber: `KE-${courseDetails.invoiceCode}-${receiptSerialNo}`,
    });

    const userData = userDoc.data() || {};
    const courses = userData.courses || [];
    const updatedPendingArray = (userData.pending || []).filter(
      (id) => id !== courseDetails.id
    );

    if (!courses.includes(courseDetails.id)) {
      transaction.update(userDocRef, {
        courses: [...courses, courseDetails.id],
      });
    }
    transaction.update(userDocRef, { pending: updatedPendingArray });
  });

  const updatedDoc = await getDoc(userPaymentsRef);
  return updatedDoc.data();
}

export async function handleFailedPayment(userDocID, courseID) {
  const userDocRef = doc(db, "users", userDocID);
  const userPaymentsRef = doc(
    db,
    "users",
    userDocID,
    "user_payments",
    courseID
  );

  try {
    await runTransaction(db, async (transaction) => {
      const [userDoc, userPaymentDoc] = await Promise.all([
        transaction.get(userDocRef),
        transaction.get(userPaymentsRef),
      ]);

      if (!userDoc.exists()) {
        throw new Error("User document does not exist!");
      }

      if (
        userPaymentDoc.exists() &&
        userPaymentDoc.data().paymentStatus !== "Approved"
      ) {
        transaction.update(userPaymentsRef, {
          paymentStatus: "Rejected",
          updatedDate: Timestamp.fromDate(new Date()),
        });
      }

      const userData = userDoc.data();
      const updatedPendingArray = (userData.pending || []).filter(
        (id) => id !== courseID
      );

      transaction.update(userDocRef, { pending: updatedPendingArray });
    });
  } catch (error) {
    console.error("Failed payment transaction error:", error);
    throw error;
  }
}

export const generateUniqueIds = () => ({
  subMerchantId: uuidv4().replace(/-/g, ""),
  merchantTranId: uuidv4().replace(/-/g, ""),
  billNumber: `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
});

export const formatDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5);
  return format(date, "dd/MM/yyyy hh:mm a");
};
