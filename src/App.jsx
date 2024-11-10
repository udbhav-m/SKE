import { Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";

function App() {
  const location = useLocation();
  console.log(location.pathname);
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div
        className={
          location.pathname === "/"
            ? `flex-grow flex items-center justify-center `
            : ""
        }
      >
        <Outlet />
      </div>
    </div>
  );
}

export default App;
