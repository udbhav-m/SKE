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
} from "../utils/utils";
import Processing from "../components/processing";
import ErrorComponent from "../components/errorComp";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseDetails } = location.state;
  let date = formatDate();
  var { subMerchantId, merchantTranId, billNumber } = generateUniqueIds();
  const [guides, setGuides] = useState([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState({ currentStatus: "", title: "" });
  const [inProgress, setInprogress] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dasajiName: "",
    address: "",
    cityOrDist: "",
    state: "",
    country: "India",
    pincode: "",
    aadharOrPan: "",
    gothram: "",
    sankalpam: "",
    email: "",
    phone: "",
    upiId: "",
    amount: "",
  });

  const [requestBody, setRequestBody] = useState({
    payerVa: "",
    amount: "",
    note: "",
    collectByDate: date,
    subMerchantId: subMerchantId,
    subMerchantName: "Sri Kalki Events",
    merchantTranId: merchantTranId,
    billNumber: billNumber,
  });

  const [isPhoneEditable, setIsPhoneEditable] = useState(true);
  const [isEmailEditable, setIsEmailEditable] = useState(true);

  useEffect(() => {
    let data = generateUniqueIds();
    subMerchantId = data.subMerchantId;
    merchantTranId = data.merchantTranId;
    billNumber = data.billNumber;
  }, [error]);

  useEffect(() => {
    async function loadGuides() {
      const guideNames = await fetchGuideNames();
      setGuides(guideNames);
    }
    loadGuides();
  }, []);

  useEffect(() => {
    console.log(courseDetails);
    const fetchedAmount = courseDetails.inr_amount;
    const storedName = localStorage.getItem("name");
    const storedPhone = localStorage.getItem("phone");
    const storedEmail = localStorage.getItem("email");

    setFormData((prevData) => ({ ...prevData, amount: fetchedAmount }));
    setRequestBody((prevData) => ({ ...prevData, amount: fetchedAmount }));
    setRequestBody((prevData) => ({
      ...prevData,
      note: `payment`,
    }));

    if (storedPhone) {
      setFormData((prevData) => ({
        ...prevData,
        name: storedName,
        phone: storedPhone,
      }));
      setIsPhoneEditable(false);
      setIsEmailEditable(true);
    } else if (storedEmail) {
      setFormData((prevData) => ({
        ...prevData,
        name: storedName,
        email: storedEmail,
      }));
      setIsPhoneEditable(true);
      setIsEmailEditable(false);
    }
  }, [courseDetails]);

  function validateAadhaarOrPAN(input) {
    const aadhaarRegex = /^\d{12}$/; // 12-digit numeric Aadhaar number
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/; // PAN format: ABCDE1234F

    if (aadhaarRegex.test(input)) {
      return { valid: true, type: "Aadhaar" };
    } else if (panRegex.test(input)) {
      return { valid: true, type: "PAN" };
    } else {
      return {
        valid: false,
        type: "Invalid",
        message: "Invalid Aadhaar or PAN format",
      };
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInprogress(true);
    const userDocID = localStorage.getItem("docId");
    const courseID = courseDetails.id;

    const {
      name,
      dasajiName,
      address,
      cityOrDist,
      state,
      country,
      pincode,
      aadharOrPan,
      gothram,
      sankalpam,
      email,
      phone,
      upiId,
    } = formData;

    // Validation logic
    if (!name) {
      setError("Name is required.");
      setInprogress(false);
      return;
    }

    if (!email && !phone) {
      setError(" Email and Phone must be provided.");
      setInprogress(false);
      return;
    }
    const phoneRegex = /^[6-9]\d{9}$/;

    if (localStorage.getItem("email") && (!phone || !phoneRegex.test(phone))) {
      setError("Phone is mandatory");
      setInprogress(false);
      return;
    }

    if (localStorage.getItem("phone") && !email) {
      setError("Email is mandatory .");
      setInprogress(false);
      return;
    }
    const data = validateAadhaarOrPAN(formData.aadharOrPan);
    if (!data?.valid) {
      setError(data?.message);
      setInprogress(false);
      return;
    }

    const requiredFields = {
      dasajiName,
      address,
      cityOrDist,
      state,
      country,
      pincode,
      aadharOrPan,
      gothram,
      sankalpam,
      upiId,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        setError(`${key.charAt(0).toUpperCase() + key.slice(1)} is required.`);
        setInprogress(false);
        return;
      }
    }

    try {
      const userPaymentsRef = doc(
        db,
        "users",
        userDocID,
        "user_payments",
        courseID
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
          courseId: courseID,
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
          courseID,
          formData,
          navigate
        );
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

        {/* Responsive Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name (from localStorage, uneditable) */}
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled
          />

          {/* Dasa Name */}
          <SelectField
            label="Dasa Name"
            value={formData.dasajiName}
            onChange={(e) =>
              setFormData({ ...formData, dasajiName: e.target.value })
            }
            options={guides}
          />

          {/* Address */}
          <InputField
            label="Address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />

          {/* City */}
          <InputField
            label="City"
            value={formData.cityOrDist}
            onChange={(e) =>
              setFormData({ ...formData, cityOrDist: e.target.value })
            }
          />

          {/* State */}
          <InputField
            label="State"
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
          />

          {/* Country */}
          <SelectField
            label="Country"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            options={[
              "India",
              "United States",
              "Canada",
              "Australia",
              "United Kingdom",
              "Germany",
              "France",
              "Japan",
              "Brazil",
              "South Africa",
              "China",
              "Russia",
              "Italy",
              "Spain",
              "Mexico",
              "New Zealand",
              "South Korea",
              "Saudi Arabia",
              "Netherlands",
              "Singapore",
              "others",
            ]}
          />

          {/* Pincode */}
          <InputField
            label="Pincode"
            value={formData.pincode}
            onChange={(e) =>
              setFormData({ ...formData, pincode: e.target.value })
            }
          />

          {/* Adhaar/PAN */}
          <InputField
            label="Adhaar/PAN No."
            value={formData.aadharOrPan}
            onChange={(e) =>
              setFormData({ ...formData, aadharOrPan: e.target.value })
            }
          />

          {/* Gothram */}
          <InputField
            label="Gothram"
            value={formData.gothram}
            onChange={(e) =>
              setFormData({ ...formData, gothram: e.target.value })
            }
          />

          {/* Sankalpam */}
          <InputField
            label="Sankalpam"
            value={formData.sankalpam}
            onChange={(e) =>
              setFormData({ ...formData, sankalpam: e.target.value })
            }
          />

          {/* Email */}
          <InputField
            label="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={!isEmailEditable}
          />

          {/* Phone */}
          <InputField
            label="Phone"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            disabled={!isPhoneEditable}
          />

          {/* UPI ID */}
          <InputField
            label="UPI ID"
            value={formData.upiId}
            onChange={(e) => {
              setFormData({ ...formData, upiId: e.target.value });
              setRequestBody({ ...requestBody, payerVa: e.target.value });
            }}
          />
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
