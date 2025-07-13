import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";

function Search() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [err, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let user = localStorage.getItem("docId");
    if (user && user !== undefined && user !== null) {
      navigate("/home");
    }
  }, []);

  async function quickUserLookup(isPhoneNumber) {
    try {
      if (isPhoneNumber) {
        // For phone numbers, use the signInMethods check similar to email
        const phoneNumber = "+91" + id;
        // This is a faster way to check if phone exists in Auth
        const methods = await fetchSignInMethodsForEmail(auth, phoneNumber);
        if (methods.length > 0) {
          const q = query(
            collection(db, "users"),
            where("phone", "==", phoneNumber)
          );
          return await getDocs(q);
        }
      } else {
        // Email lookup remains the same
        const methods = await fetchSignInMethodsForEmail(auth, id);
        if (methods.length > 0) {
          const q = query(
            collection(db, "users"),
            where("email", "==", id)
          );
          return await getDocs(q);
        }
      }
      return null;
    } catch {
      // Fallback to Firestore if Auth check fails
      const field = isPhoneNumber ? "phone" : "email";
      const value = isPhoneNumber ? "+91" + id : id;
      const q = query(
        collection(db, "users"),
        where(field, "==", value)
      );
      return await getDocs(q);
    }
  }

  async function findUser(isPhoneNumber) {
    setIsLoading(true);
    try {
      const querySnapshot = await quickUserLookup(isPhoneNumber);
      
      if (querySnapshot && !querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        localStorage.setItem(isPhoneNumber ? "phone" : "email", id);
        localStorage.setItem("name", data.name);
        localStorage.setItem("docId", doc.id);
        
        navigate("/home");
      } else {
        setError("User not found. Please create an account in the Kalki Events app through mobile.");
        setTimeout(() => setError(""), 15000);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("An error occurred while searching. Please try again.");
      setTimeout(() => setError(""), 10000);
    } finally {
      setIsLoading(false);
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
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E67E22] focus:ring-offset-2 transition-colors duration-200 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#E67E22] text-white hover:bg-[#D35400]"
            }`}
          >
            {isLoading ? "Searching..." : "Find"}
          </button>
          
          {err && (
            <p className="text-center font-semibold text-red-500">
              {err}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;