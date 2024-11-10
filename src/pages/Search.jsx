import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function Search() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [err, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  useEffect(() => {
    let user = localStorage.getItem("docId");
    if (user && user !== undefined && user !== null) {
      navigate("/home");
    }
  }, []);

  async function findUser(isPhoneNumber) {
    setIsLoading(true); // Set loading to true when search starts
    let foundDoc = false;
    const docs = await getDocs(collection(db, "users"));
    docs.forEach((doc) => {
      let data = doc.data();
      if (
        (isPhoneNumber && data.phone == "+91" + id) ||
        (!isPhoneNumber && data.email == id)
      ) {
        foundDoc = doc.id;
        localStorage.setItem(isPhoneNumber ? "phone" : "email", id);
        localStorage.setItem("name", data.name);
        localStorage.setItem("docId", foundDoc);
      }
    });
    setIsLoading(false); // Set loading to false after search is complete
    if (foundDoc && localStorage.getItem("docId")) {
      navigate("/home");
    } else {
      setError("User not found");
      setTimeout(() => setError(""), 10000);
    }
  }

  function handleValidation() {
    const phoneRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const isPhoneNumber = phoneRegex.test(id);
    const isEmail = emailRegex.test(id);

    if (isPhoneNumber || isEmail) {
      findUser(isPhoneNumber);
    } else {
      setError("Invalid Email / Phone number");
      setTimeout(() => setError(""), 10000);
    }
  }

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Find user
        </h2>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone number or Email address
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E67E22] focus:border-[#E67E22] ${
                err ? "border-2 border-red-700" : ""
              }`}
              placeholder="Phone number or Email address"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleValidation}
            disabled={isLoading} // Disable button when loading
            className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E67E22] focus:ring-offset-2 transition-colors duration-200 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#E67E22] text-white hover:bg-[#D35400]"
            } `}
          >
            {isLoading ? "Searching..." : "Find"}
          </button>
          {err && (
            <p className="text-center  font-semibold text-red-500">
              {err}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;
