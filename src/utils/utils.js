

export const isFieldInvalid = (field, value) => {
  switch (field) {
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) return "Email is required.";
      if (!emailRegex.test(value)) return "Enter a valid email address.";
      break;
    }

    case "phone": {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!value.trim()) return "Phone number is required.";
      if (!phoneRegex.test(value))
        return "Enter a valid 10-digit phone number.";
      break;
    }

    case "pincode": {
      const pincodeRegex = /^\d{4,10}$/;
      if (!value.trim()) return "Pincode is required.";
      if (!pincodeRegex.test(value))
        return "Pincode must be between 4 to 10 digits.";
      break;
    }

    case "aadhar": {
      const aadhaarRegex = /^\d{12}$/;
      if (!value.trim()) return "Aadhar number is required.";
      if (!aadhaarRegex.test(value)) return "Aadhar must be exactly 12 digits.";
      break;
    }

    case "pan": {
      const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
      if (!value.trim()) return "PAN number is required.";
      if (!panRegex.test(value))
        return "PAN must follow the format: 5 letters, 4 digits, and 1 letter.";
      break;
    }

    case "dasajiName":
      if (!value || value === "Select Dasa Name" || value === "")
        return "Please select a Dasa name.";
      break;

    case "address":
      if (!value.trim()) return "Address cannot be empty.";
      break;
    case "upiId":
      if (!value.trim()) return "UPI ID cannot be empty.";
      break;

    case "cityOrDist":
      if (!value.trim()) return "City or district is required.";
      break;

    case "state":
      if (!value.trim()) return "State is required.";
      break;

    case "country":
      if (!value.trim()) return "Country is required.";
      break;

    case "gothram":
      if (!value.trim()) return "Gothram is required.";
      break;

    case "sankalpam":
      if (!value.trim()) return "Sankalpam is required.";
      break;

    case "name":
      if (!value.trim()) return "Name is required.";
      break;

    default:
      if (!value) return "This field is required.";
      break;
  }
  return ""; // No error if field is valid
};

export async function checkPhoneEmail(formData, setError, setInprogress) {
  
  if (
    localStorage.getItem("email") &&
    (!formData.phone || isFieldInvalid("phone", formData.phone))
  ) {
    setError("Phone is mandatory");
    setInprogress(false);
    return;
  }

  if (
    localStorage.getItem("phone") &&
    (!formData.email || isFieldInvalid("email", formData.email))
  ) {
    setError("Email is mandatory.");
    setInprogress(false);
    return;
  }
}

export function setPhoneMailName(
  setFormData,
  setIsPhoneEditable,
  setIsEmailEditable
) {
  const storedName = localStorage.getItem("name");
  const storedPhone = localStorage.getItem("phone");
  const storedEmail = localStorage.getItem("email");

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
}

export const countriesList = [
  "India",
  "USA",
  "Canada",
  "Australia",
  "Malaysia",
  "Dubai",
  "Sri Lanka",
  "Singapore",
  "others",
];

export function getCurrentTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); 
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0"); 

  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}

///////////////////////////////////////////////////////////////////////////////////////////////////


