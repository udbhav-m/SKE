import { useLocation, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = localStorage.getItem("user");

  return (
    <>
      <div className="p-5 shadow-xl bg-[#E5870D] flex justify-between items-center">
        <div className="flex items-center gap-3 select-none">
          <img src="/favicon-new.png" alt="Amma Bhagavan's Image" />
          <h1 className="font-semibold text-xl select-none">
            Sri Kalki Events
          </h1>
        </div>
        <div
          className={
            location.pathname == "/" || location.pathname == "/search"
              ? "hidden"
              : "visible"
          }
        >
          <h1 className={`text-white font-semibold text-lg `}>
            {"You're paying for: " + currentUser}
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
            className=" bg-secondary text-custom-brown font-semibold px-2 rounded w-fit"
          >
            Pay for a different user
          </button>
        </div>
      </div>
    </>
  );
}
