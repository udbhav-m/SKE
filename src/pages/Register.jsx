import { useParams } from "react-router-dom";
import Button from "../components/Button";
import InputF from "../components/InputF";

function Register() {
  const { course } = useParams();
  return (
    <div className="flex justify-center mt-16 select-none">
      <div className="w-5/6 md:w-4/6 lg:w-3/6 h-auto p-8 shadow-2xl bg-white flex justify-center text-center rounded-md ">
        <div className="flex flex-col gap-5">
          <h1 className="text-2xl font-bold">{"Register - " + course}</h1>
          <InputF
            onChange={(e) => setId(e.target.value)}
            label={"Name"}
            type={"text"}
            placeholder={"Name"}
          />
          <InputF
            onChange={(e) => setId(e.target.value)}
            label={"Email "}
            type={"email"}
            placeholder={"Email address"}
          />
          <InputF
            onChange={(e) => setId(e.target.value)}
            label={"Phone"}
            type={"number"}
            placeholder={"Phone number"}
          />
          <InputF
            onChange={(e) => setId(e.target.value)}
            label={"UPI ID"}
            type={"text"}
            placeholder={"UPI ID"}
          />

          <Button label={"Pay"} onClick={""} />
        </div>
      </div>
    </div>
  );
}

export default Register;
