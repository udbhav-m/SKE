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
  isFieldInvalid,
  setPhoneMailName,
} from "../utils/utils";

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
    upiId: "",
    // pan: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    ids = generateUniqueIds();
    date = formatDate()
    setRequestBody((prevData) => ({
      ...prevData,
      collectByDate: date,
      subMerchantId: ids.subMerchantId,
      merchantTranId: ids.merchantTranId,
      billNumber: ids.billNumber,
    }));
    const userDocID = localStorage.getItem("docId");
    // const courseID = ;

    checkPhoneEmail(formData, setError, setInprogress);

    const newInvalidFields = {};

    // Validate all fields
    Object.keys(formData).forEach((field) => {
      const isInvalid = isFieldInvalid(field, formData[field]);
      if (field === "pan") {
        if (formData.amount >= 50000 && isInvalid) {
          newInvalidFields[field] = true; // PAN is mandatory for amounts >= 50000
        } else if (formData.amount < 50000) {
          // If amount is less than 50000, PAN is not mandatory, mark it as valid
          delete newInvalidFields[field];
        }
      } else if (isInvalid) {
        newInvalidFields[field] = true;
      }
    });

    setInvalidFields(newInvalidFields);

    // If any field is invalid, prevent submission
    if (Object.values(newInvalidFields).some((value) => value)) {
      return;
    }

    setInprogress(true);

    if (error) return;

    try {
      const userPaymentsRef = doc(
        db,
        "users",
        userDocID,
        "user_payments",
        courseDetails.id
      );
      const courseDoc = await getDoc(userPaymentsRef);

      if (courseDoc.exists()) {
        // If course is already purchased
        const paymentStatus = courseDoc.data().paymentStatus;
        if (paymentStatus === "Approved") {
          setError("You have already purchased this course.");
          setInprogress(false);
          return;
        } else if (paymentStatus === "Pending") {
          setError(
            "Payment is already in progress. Please wait or cancel the current request."
          );
          setInprogress(false);
          return;
        }
      }

      // Set the payment status to "Pending" before making the payment
      await runTransaction(db, async (transaction) => {
        transaction.set(userPaymentsRef, {
          paymentDate: new Date().toISOString(),
          paymentStatus: "Pending",
          paymentType: "UPI",
          courseId: courseDetails.id,
          courseName: courseDetails.name,
        });
      });

      setStatus({
        title: "Processing your payment..",
        currentStatus: "Sending UPI payment request.",
      });

      const BankRRN = await makePayment({ reqBodyData: requestBody });
      console.log("bank RRN", BankRRN);

      if (BankRRN) {
        checkPayment(
          BankRRN,
          setStatus,
          userDocID,
          courseDetails,
          formData,
          navigate
        );
        setInprogress(false);
      } else {
        await runTransaction(db, async (transaction) => {
          transaction.delete(userPaymentsRef); // Remove the "Pending" payment status document
        });
        setStatus({ currentStatus: "", title: "" });
        setError(
          "UPI ID you've provided is invalid or try refreshing the page."
        );
        setInprogress(false);
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setInprogress(false);
      setError("Something went wrong. Please try again.");
      setStatus({ currentStatus: "", title: "" });
    }
  };

  const handleOnChange = (field, value) => {
    const isInvalid = isFieldInvalid(field, value);

    setInvalidFields((previousInvalidFields) => ({
      ...previousInvalidFields,
      [field]: isInvalid,
    }));

    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  useEffect(() => {
    console.log(courseDetails);
    const fetchedAmount = courseDetails.inr_amount;
    setFormData((prevData) => ({ ...prevData, amount: fetchedAmount }));
    setRequestBody((prevData) => ({ ...prevData, amount: fetchedAmount }));
    setRequestBody((prevData) => ({
      ...prevData,
      note: `payment`,
    }));

    setPhoneMailName(setFormData, setIsPhoneEditable, setIsEmailEditable);

    async function loadGuides() {
      const guideNames = await fetchGuideNames();
      setGuides(guideNames);
    }
    loadGuides();
  }, [courseDetails]);

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
          {/* Name (from localStorage, uneditable) */}
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => handleOnChange("name", e.target.value)}
            disabled
          />

          {/* Dasa Name */}
          <SelectField
            label="Dasa Name"
            value={formData.dasajiName}
            onChange={(e) => handleOnChange("dasajiName", e.target.value)}
            options={guides}
            hasError={invalidFields.dasajiName}
          />

          {/* Address */}
          <InputField
            label="Address"
            value={formData.address}
            onChange={(e) => handleOnChange("address", e.target.value)}
            hasError={invalidFields.address}
          />

          {/* City */}
          <InputField
            label="City"
            value={formData.cityOrDist}
            onChange={(e) => handleOnChange("cityOrDist", e.target.value)}
            hasError={invalidFields.cityOrDist}
          />

          {/* State */}
          <InputField
            label="State"
            value={formData.state}
            onChange={(e) => handleOnChange("state", e.target.value)}
            hasError={invalidFields.state}
          />

          {/* Country */}
          <SelectField
            label="Country"
            value={formData.country}
            onChange={(e) => handleOnChange("country", e.target.value)}
            options={countries}
            hasError={invalidFields.country}
          />

          {/* Pincode */}
          <InputField
            label="Pincode"
            value={formData.pincode}
            onChange={(e) => handleOnChange("pincode", e.target.value)}
            hasError={invalidFields.pincode}
          />

          {/* Aadhar */}
          <InputField
            label="Aadhar"
            value={formData.aadhar}
            onChange={(e) => handleOnChange("aadhar", e.target.value)}
            hasError={invalidFields.aadhar}
          />

          {/* Gothram */}
          <InputField
            label="Gothram"
            value={formData.gothram}
            onChange={(e) => handleOnChange("gothram", e.target.value)}
            hasError={invalidFields.gothram}
          />

          {/* Sankalpam */}
          <InputField
            label="Sankalpam"
            value={formData.sankalpam}
            onChange={(e) => handleOnChange("sankalpam", e.target.value)}
            hasError={invalidFields.sankalpam}
          />

          {/* Email */}
          <InputField
            label="Email"
            value={formData.email}
            onChange={(e) => handleOnChange("email", e.target.value)}
            disabled={!isEmailEditable}
            hasError={invalidFields.email}
          />

          {/* Phone */}
          <InputField
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleOnChange("phone", e.target.value)}
            disabled={!isPhoneEditable}
            hasError={invalidFields.phone}
          />

          {/* UPI ID */}
          <InputField
            label="UPI ID"
            value={formData.upiId}
            onChange={(e) => {
              handleOnChange("upiId", e.target.value);
              setRequestBody({ ...requestBody, payerVa: e.target.value });
            }}
            hasError={invalidFields.upiId}
          />
          {/* Pan */}
          {formData.amount >= 50000 ? (
            <InputField
              label="PAN number"
              value={formData.pan}
              onChange={(e) => {
                handleOnChange("pan", e.target.value);
                setRequestBody({ ...requestBody, payerVa: e.target.value });
              }}
              hasError={invalidFields.upiId}
            />
          ) : (
            ""
          )}
        </div>

        {/* Amount */}
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

        {/* Submit Button */}
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
