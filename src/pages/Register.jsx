import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";
import FormContainer from "../components/FormContainer";
import {
  checkPayment,
  fetchGuideNames,
  formatDate,
  generateUniqueIds,
  makePayment,
} from "../utils/payment-utils";
import Processing from "../components/processing";
import ErrorComponent from "../components/errorComp";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import {
  checkPhoneEmail,
  countriesList,
  getCurrentTimestamp,
  isFieldInvalid,
  setPhoneMailName,
} from "../utils/utils";
import { format } from "date-fns";
import n2words from "n2words";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  let date = formatDate();
  var ids = generateUniqueIds();
  const countries = countriesList;
  const { courseDetails } = location.state;

  const [guides, setGuides] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState({ currentStatus: "", title: "" });
  const [inProgress, setInprogress] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});
  const [userDoc, setUserDoc] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    dasajiName: "",
    address: "",
    cityOrDist: "",
    state: "",
    country: "India",
    pincode: "",
    aadhar: "",
    gothram: "",
    sankalpam: "",
    email: "",
    phone: "",
    pan: "",
    upiId: "",
    amount: courseDetails.amount,
  });

  const [requestBody, setRequestBody] = useState({
    payerVa: "",
    amount: "",
    note: "",
    collectByDate: date,
    subMerchantId: ids.subMerchantId,
    subMerchantName: "Sri Kalki Events",
    merchantTranId: ids.merchantTranId,
    billNumber: ids.billNumber,
  });

  const [isPhoneEditable, setIsPhoneEditable] = useState(true);
  const [isEmailEditable, setIsEmailEditable] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userDocID = localStorage.getItem("docId");
        if (!userDocID) return;

        const userDocRef = doc(db, "users", userDocID);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          setUserDoc(userDocSnapshot);
          setFormData((prevData) => ({
            ...prevData,
            dasajiName: userData.guide || userData.dasajiName || "",
            address: userData.address || "",
            cityOrDist: userData.cityOrDist || userData.city || "",
            state: userData.state || "",
            country: userData.country || "India",
            pincode: userData.pincode || "",
            aadhar: userData.aadhar || "",
            gothram: userData.gothram || "",
            sankalpam: userData.sankalpam || "",
          }));
        }

        const fetchedAmount = courseDetails.inr_amount;
        setFormData((prevData) => ({ ...prevData, amount: fetchedAmount }));
        setRequestBody((prevData) => ({
          ...prevData,
          amount: fetchedAmount,
          note: "payment",
        }));

        setPhoneMailName(setFormData, setIsPhoneEditable, setIsEmailEditable);

        const guideNames = await fetchGuideNames();
        setGuides(guideNames);
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, [courseDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    ids = generateUniqueIds();
    date = formatDate();
    const userDocID = localStorage.getItem("docId");

    setRequestBody((prevData) => ({
      ...prevData,
      collectByDate: date,
      subMerchantId: ids.subMerchantId,
      merchantTranId: ids.merchantTranId,
      billNumber: ids.billNumber,
    }));

    checkPhoneEmail(formData, setError, setInprogress);

    const newInvalidFields = {};
    Object.keys(formData).forEach((field) => {
      const isInvalid = isFieldInvalid(field, formData[field]);
      if (field === "pan") {
        if (formData.amount >= 50000 && isInvalid) {
          newInvalidFields[field] = "PAN is required for amounts >= 50000";
        }
      } else if (isInvalid) {
        newInvalidFields[field] = isInvalid;
      }
    });

    setInvalidFields(newInvalidFields);

    if (Object.keys(newInvalidFields).length > 0) {
      setError("Please fill the fields in the form.");
      return;
    }

    if (error) return;

    setInprogress(true);
    try {
      const userPaymentsRef = doc(
        db,
        "users",
        userDocID,
        "user_payments",
        courseDetails.id
      );
      const userDocRef = doc(db, "users", userDocID);
      const courseDoc = await getDoc(userPaymentsRef);

      const timeStamp = getCurrentTimestamp();
      const now = new Date();
      const formattedDate = format(now, "dd-MMM-yyyy");

      if (courseDoc.exists()) {
        const paymentStatus = courseDoc.data().paymentStatus;
        if (paymentStatus === "Approved") {
          setError("You have already purchased this course.");
          setInprogress(false);
          return;
        } else if (paymentStatus === "Intiated") {
          setError(
            "Payment is already initiated. Please wait or cancel the current request."
          );
          setInprogress(false);
          return;
        }
      }

      await runTransaction(db, async (transaction) => {
        // Update user document with form fields
        transaction.set(
          userDocRef,
          {
            guide: formData.dasajiName,
            address: formData.address,
            cityOrDist: formData.cityOrDist,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
            aadhar: formData.aadhar,
            gothram: formData.gothram,
            sankalpam: formData.sankalpam,
          },
          { merge: true }
        );

        // Set payment document
        transaction.set(userPaymentsRef, {
          paymentDate: formattedDate,
          paymentStatus: "Intiated",
          paymentType: "UPI",
          courseId: courseDetails.id,
          courseName: courseDetails.name,
          phone: formData.phone,
          email: formData.email,
          emailphone:
            localStorage.getItem("email") ||
            "+91" + localStorage.getItem("phone"),
          name: formData.name,
          dasajiName: formData.dasajiName,
          updatedDate: new Date().toISOString(),
          receiptNumber: `KE-${courseDetails.invoiceCode}-${timeStamp}`,
          amount: formData.amount,
          amountInWords: n2words(formData.amount),
          fullAddress: `${formData.address}, ${formData.cityOrDist}, ${formData.state}, ${formData.country}, ${formData.pincode}`,
          address: formData.address,
          cityOrDist: formData.cityOrDist,
          state: formData.state,
          country: formData.country,
          pan: formData.pan || "",
          aadharOrPan: formData.aadhar,
        });

        const pending = userDoc?.data()?.pending || [];
        pending.push(courseDetails.id);
        transaction.set(userDocRef, { pending }, { merge: true });
      });

      setStatus({
        title: "Processing your payment..",
        currentStatus: "Sending UPI payment request.",
      });

      const BankRRN = await makePayment({ reqBodyData: requestBody });
      console.log("Payment BankRRN:", BankRRN);

      if (BankRRN) {
        checkPayment(
          BankRRN,
          setStatus,
          setError,
          userDocID,
          courseDetails,
          navigate,
          userPaymentsRef
        );
        setInprogress(false);
      } else {
        await runTransaction(db, async (transaction) => {
          const pending = userDoc?.data()?.pending || [];
          const updatedPending = pending.filter(
            (id) => id !== courseDetails.id
          );

          transaction.delete(userPaymentsRef);
          transaction.set(
            userDocRef,
            { pending: updatedPending },
            { merge: true }
          );
        });
        setStatus({ currentStatus: "", title: "" });
        setError(
          "UPI ID you've provided is invalid or try refreshing the page."
        );
        setInprogress(false);
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      setInprogress(false);
      setError("Something went wrong. Please try again.");
      setStatus({ currentStatus: "", title: "" });
    }
  };

  const handleOnChange = (field, value) => {
    const errorMessage = isFieldInvalid(field, value);

    setInvalidFields((previousInvalidFields) => ({
      ...previousInvalidFields,
      [field]: errorMessage,
    }));

    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  return (
    <>
      <div
        className="inline-block mt-6 ml-6 hover:cursor-pointer"
        onClick={() => navigate("/home")}
      >
        <ArrowLeft />
      </div>
      {status.currentStatus ? (
        <Processing title={status.title} status={status.currentStatus} />
      ) : (
        ""
      )}
      {error ? (
        <ErrorComponent
          message={error}
          onClickClose={() => {
            setError("");
          }}
        />
      ) : (
        ""
      )}
      <FormContainer onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold mb-4 self-center">
          {"Registering for " + courseDetails?.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <InputField
              label="Name"
              value={formData.name}
              onChange={(e) => handleOnChange("name", e.target.value)}
              disabled
            />
            {invalidFields.name && (
              <p className="text-red-500 text-sm mt-1">{invalidFields.name}</p>
            )}
          </div>

          <div>
            <SelectField
              label="Dasa Name"
              value={formData.dasajiName}
              onChange={(e) => handleOnChange("dasajiName", e.target.value)}
              options={guides}
              hasError={invalidFields.dasajiName}
            />
            {invalidFields.dasajiName && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.dasajiName}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="Address"
              value={formData.address}
              onChange={(e) => handleOnChange("address", e.target.value)}
              hasError={invalidFields.address}
            />
            {invalidFields.address && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.address}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="City"
              value={formData.cityOrDist}
              onChange={(e) => handleOnChange("cityOrDist", e.target.value)}
              hasError={invalidFields.cityOrDist}
            />
            {invalidFields.cityOrDist && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.cityOrDist}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="State"
              value={formData.state}
              onChange={(e) => handleOnChange("state", e.target.value)}
              hasError={invalidFields.state}
            />
            {invalidFields.state && (
              <p className="text-red-500 text-sm mt-1">{invalidFields.state}</p>
            )}
          </div>

          <div>
            <SelectField
              label="Country"
              value={formData.country}
              onChange={(e) => handleOnChange("country", e.target.value)}
              options={countries}
              hasError={invalidFields.country}
            />
            {invalidFields.country && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.country}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="Pincode"
              value={formData.pincode}
              onChange={(e) => handleOnChange("pincode", e.target.value)}
              hasError={invalidFields.pincode}
            />
            {invalidFields.pincode && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.pincode}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="Aadhar"
              value={formData.aadhar}
              onChange={(e) => handleOnChange("aadhar", e.target.value)}
              hasError={invalidFields.aadhar}
            />
            {invalidFields.aadhar && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.aadhar}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="Gothram"
              value={formData.gothram}
              onChange={(e) => handleOnChange("gothram", e.target.value)}
              hasError={invalidFields.gothram}
            />
            {invalidFields.gothram && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.gothram}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="Sankalpam"
              value={formData.sankalpam}
              onChange={(e) => handleOnChange("sankalpam", e.target.value)}
              hasError={invalidFields.sankalpam}
            />
            {invalidFields.sankalpam && (
              <p className="text-red-500 text-sm mt-1">
                {invalidFields.sankalpam}
              </p>
            )}
          </div>

          <div>
            <InputField
              label="Email"
              value={formData.email}
              onChange={(e) => handleOnChange("email", e.target.value)}
              disabled={!isEmailEditable}
              hasError={invalidFields.email}
            />
            {invalidFields.email && (
              <p className="text-red-500 text-sm mt-1">{invalidFields.email}</p>
            )}
          </div>

          <div>
            <InputField
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleOnChange("phone", e.target.value)}
              disabled={!isPhoneEditable}
              hasError={invalidFields.phone}
            />
            {invalidFields.phone && (
              <p className="text-red-500 text-sm mt-1">{invalidFields.phone}</p>
            )}
          </div>

          <div>
            <InputField
              label="UPI ID"
              value={formData.upiId}
              onChange={(e) => {
                handleOnChange("upiId", e.target.value);
                setRequestBody({ ...requestBody, payerVa: e.target.value });
              }}
              hasError={invalidFields.upiId}
            />
            {invalidFields.upiId && (
              <p className="text-red-500 text-sm mt-1">{invalidFields.upiId}</p>
            )}
          </div>

          {formData.amount >= 50000 ? (
            <div>
              <InputField
                label="PAN number"
                value={formData.pan}
                onChange={(e) => {
                  handleOnChange("pan", e.target.value);
                  setRequestBody({ ...requestBody, payerVa: e.target.value });
                }}
                hasError={invalidFields.upiId}
              />
              {invalidFields.pan && (
                <p className="text-red-500 text-sm mt-1">{invalidFields.pan}</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="text"
            className="mt-1 p-3 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            value={formData.amount}
            disabled
          />
        </div>

        <button
          type="submit"
          className="mt-5 bg-[#E5870D] text-white py-3 px-4 rounded-md hover:bg-[#d7790a] focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          disabled={inProgress}
        >
          {inProgress ? "Processing..." : "Submit"}
        </button>
      </FormContainer>
    </>
  );
}

export default Register;
