import { useNavigate } from "react-router-dom";
import BottomText from "../components/BottomText";
import Button from "../components/Button";
import Input from "../components/Input";
import { useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function Search() {
  localStorage.clear();
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [loginWithNumber, setLoginWithNumber] = useState(false);
  const [err, setError] = useState("");

  async function findUser() {
    let foundDoc = false;
    const docs = await getDocs(collection(db, "users"));
    docs.forEach((doc) => {
      let data = doc.data();
      if (
        (loginWithNumber && data.phone == "+91" + id) ||
        (!loginWithNumber && data.email == id)
      ) {
        foundDoc = doc.id;
        localStorage.setItem(loginWithNumber ? "phone" : "email", id);
        localStorage.setItem("name", data.name);
        localStorage.setItem("docId", foundDoc);
      }
    });
    if (foundDoc && localStorage.getItem("docId")) {
      navigate("/home");
    } else {
      setError("User not found");
      setTimeout(() => setError(""), 5000);
    }
  }

  function handleValidation() {
    let phone_regex = /^[6-9]\d{9}$/;
    let email_regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    let isValid = loginWithNumber ? phone_regex.test(id) : email_regex.test(id);
    // console.log(isValid);
    if (isValid) {
      findUser();
    } else {
      setError("Invalid details");
      setTimeout(() => setError(""), 5000);
    }
  }

  function handleToggle(bool) {
    setId("");
    setLoginWithNumber(bool);
  }

  return (
    <div className="flex justify-center mt-16 select-none">
      <div className="w-5/6 md:w-4/6 lg:w-3/6 h-auto p-8 shadow-2xl bg-white flex justify-center text-center rounded-md ">
        <div className="flex flex-col gap-5">
          <h1 className="text-2xl font-bold">Find user</h1>
          <Input
            onChange={(e) => setId(e.target.value)}
            label={loginWithNumber ? "Mobile number" : "Email address"}
            type={loginWithNumber ? "number" : "email"}
            placeholder={loginWithNumber ? "Mobile number" : "Email address"}
          />
          <Button label={"Find"} onClick={handleValidation} />
          <h1 className="font-semibold text-red-500">{err}</h1>
          <BottomText
            label={`Find with `}
            to={loginWithNumber ? "Email address" : "Mobile number"}
            onClick={
              loginWithNumber
                ? () => {
                    handleToggle(false);
                  }
                : () => {
                    handleToggle(true);
                  }
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Search;
