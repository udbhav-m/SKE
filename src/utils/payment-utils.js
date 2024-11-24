import { runTransaction, doc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";
import n2words from "n2words";
import axios from "axios";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { getCurrentTimestamp } from "./utils";

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

export async function checkPayment(
  bankRRN,
  setStatus,
  userDocID,
  courseDetails,
  formData,
  navigate
) {
  let attempt = 0;
  const maxAttempts = 30;
  const retryDelay = 3000; // 3 seconds delay

  try {
    while (attempt < maxAttempts) {
      const response = await axios.post(
        `${import.meta.env.VITE_LISTENPAY_API}${bankRRN}`
      );

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
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await handleFailedPayment(userDocID, courseDetails.id, formData);
        setStatus({
          currentStatus: "",
          title: "",
        });
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
    console.error("Error checking payment status:", error);
    setStatus({
      currentStatus: "An error occurred. Please try again later.",
      title: "Error",
    });
  }
}

// Function to handle Firestore transaction and prevent parallel writes
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
    day: "2-digit", // day with leading zero if necessary
    month: "short", // abbreviated month name
    year: "numeric", // 4-digit year
  });

  const receiptData = {
    paymentStatus: "Approved", // Payment status
    paymentType: "UPI", // Payment type
    courseId: courseDetails.id, // Add the courseId
    courseName: courseDetails.name,
    guide: formData.dasajiName,
    name: formData.name,
    receiptNumber: `KE-TEST24-${timeStamp}`,
    amount: formData.amount,
    amountInWords: n2words(formData.amount),
    paymentDate: formattedDate,
    address: `${
      formData.address +
      ", " +
      formData.cityOrDist +
      ", " +
      formData.state +
      ", " +
      formData.country +
      ", " +
      formData.pincode
    }`,
    aadhar: formData.aadhar,
    pan: formData.pan || "",
    email: formData.email,
    phone: formData.phone,
  };

  await runTransaction(db, async (transaction) => {
    // First, get all the necessary data before performing any writes
    const userPaymentDoc = await transaction.get(userPaymentsRef);
    const userDoc = await transaction.get(userDocRef);

    // Check if the course has already been purchased (payment status Completed)
    if (
      userPaymentDoc.exists() &&
      userPaymentDoc.data().paymentStatus === "Approved"
    ) {
      throw new Error("This course has already been purchased.");
    }

    // If the course was previously in "Pending" status, reset the status
    if (
      userPaymentDoc.exists() &&
      userPaymentDoc.data().paymentStatus === "Pending"
    ) {
      transaction.update(userPaymentsRef, { paymentStatus: "Pending" }); // Reset to Pending
    }

    // Set payment data in Firestore
    transaction.set(userPaymentsRef, receiptData);

    // Handle courses update in the user document
    const courses = userDoc.exists() ? userDoc.data()?.courses || [] : [];
    const updateData = {};

    // If the course isn't in the user's courses, add it
    if (!courses.includes(courseDetails.id)) {
      courses.push(courseDetails.id);
      updateData.courses = courses;
    }
    const updateTime = userDoc.updateTime;

    // Checking and adding fields only if they don't exist in the document
    if (userDoc.exists()) {
      // If document exists, check each field
      const existingData = userDoc.data();

      if (formData.address && !existingData?.address) {
        updateData.address = formData.address;
      }
      if (formData.cityOrDist && !existingData?.city) {
        updateData.city = formData.cityOrDist;
      }
      if (formData.state && !existingData?.state) {
        updateData.state = formData.state;
      }
      if (formData.country && !existingData?.country) {
        updateData.country = formData.country;
      }
      if (formData.pincode && !existingData?.pincode) {
        updateData.pincode = formData.pincode;
      }
      if (formData.aadhar && !existingData?.aadhar) {
        updateData.aadhar = formData.aadhar;
      }
      if (formData.pan && !existingData?.pan) {
        updateData.pan = formData.pan;
      }
      if (!existingData?.email) {
        updateData.email = localStorage.getItem("email") || formData.email;
      }
      if (!existingData?.phone) {
        updateData.phone =
          "+91" + (localStorage.getItem("phone") || formData.phone);
      }

      // If there is any data to update, perform an update
      if (Object.keys(updateData).length > 0) {
        await runTransaction(db, async (transaction) => {
          transaction.update(userDocRef, updateData, {
            currentDocument: {
              updateTime,
            },
          });
        });
      }
    } else {
      // If document doesn't exist, create the document with all fields
      await runTransaction(db, async (transaction) => {
        transaction.set(userDocRef, {
          courses: [courseDetails.id],
          address: formData.address,
          city: formData.cityOrDist,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
          aadhar: formData.aadhar,
          pan: formData.pan || "",
          email: localStorage.getItem("email") || formData.email,
          phone: "+91" + (localStorage.getItem("phone") || formData.phone),
        });
      });
    }
  }).catch((error) => {
    console.error("Transaction failed:", error);
    throw error;
  });
  console.log("Receipt Data:", receiptData);
  return receiptData;
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
