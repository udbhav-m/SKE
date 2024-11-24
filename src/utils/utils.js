export const isFieldInvalid = (field, value) => {
  switch (field) {
    case "email":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value && !emailRegex.test(value);

    case "phone":
      const phoneRegex = /^[6-9]\d{9}$/;
      return value && !phoneRegex.test(value);

    case "pincode":
      const pincodeRegex = /^\d{4,10}$/;
      return value && !pincodeRegex.test(value);

    case "aadhar":
      const aadhaarRegex = /^\d{12}$/;
      return value && !aadhaarRegex.test(value);

    case "pan":
      const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;
      return value && !panRegex.test(value);

    case "dasajiName":
    case "address":
    case "cityOrDist":
    case "state":
    case "country":
    case "gothram":
    case "sankalpam":
    case "name":
      return !String(value).trim().length > 0;

    default:
      return !String(value).trim().length > 0;
  }
};

export function checkPhoneEmail(formData, setError, setInprogress) {
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
];

export function getCurrentTimestamp() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0"); // Ensures 3 digits for milliseconds

  return `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
}
