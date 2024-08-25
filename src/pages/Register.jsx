import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import InputF from "../components/InputF";

function Register() {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { courseDetails } = location.state;
  return (
    <>
      <div className="inline-block mt-6 ml-6 hover:cursor-pointer" onClick={() => navigate("/home")}>
        <Arrow />
      </div>
      <div className="flex justify-center select-none">
        <div className="w-5/6 md:w-4/6 lg:max-w-lg h-auto p-8 shadow-2xl bg-white flex justify-center text-center rounded-md ">
          <div className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold text-wrap">
              {"Register - " + courseDetails?.name}
            </h1>
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
            <div className="text-lg font-semibold">
              {"Amount : " + courseDetails?.inr_amount}
            </div>

            <div className="w-full">
              <Button label={"Proceed to pay"} onClick={""} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Arrow() {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 448 512"
        width="24"
        height="24"
      >
        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
      </svg>
    </>
  );
}

export default Register;
