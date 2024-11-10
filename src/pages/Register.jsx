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
} from "../firebase/utils";
import Processing from "../components/processing";
import ErrorComponent from "../components/errorComp";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseDetails } = location.state;
  let date = formatDate();
  var { subMerchantId, merchantTranId, billNumber } = generateUniqueIds();
  const [guides, setGuides] = useState([]);

  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  // const paymentData = {
  //   paymentDate,
  //   paymentId,
  //   paymentStatus,
  //   paymentType,
  // };

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
    setRequestBody((prevData) => ({ ...prevData, amount: 1 })); //hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userDocID = localStorage.getItem("docId");
    const courseID = courseDetails.id;
  
    try {
      // 1. Check if the course is already purchased
      const userPaymentsRef = doc(db, "users", userDocID, "user_payments", courseID);
      const courseDoc = await getDoc(userPaymentsRef);
  
      // If the course is already in user_payments, don't initiate payment
      if (courseDoc.exists()) {
        setError("You have already purchased this course.");
        return;
      }
  
      // 2. Define payment data for the Firestore write
      const paymentData = {
        paymentDate: new Date().toISOString(),
        paymentStatus: "Pending", // Will update later on payment success
        paymentType: "UPI",
        // Add any other necessary fields here
      };
  
      // 3. Set request body for initiating payment
      setStatus("Sending UPI payment request.");
      const BankRRN = await makePayment({ reqBodyData: requestBody });
      console.log("bank RRN", BankRRN);
  
      if (BankRRN) {
        // After payment request is sent, check payment status
        checkPayment(BankRRN, setStatus, userDocID, courseID, formData);
      } else {
        setStatus("");
        setError("UPI ID you've provided is invalid or try refreshing the page.");
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      setError("Something went wrong. Please try again.");
      setStatus("");
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
      {status ? <Processing status={status} /> : ""}
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
          <InputField
            label="Country"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
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
        >
          Submit
        </button>
      </FormContainer>
    </>
  );
}

export default Register;
