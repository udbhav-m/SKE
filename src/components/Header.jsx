import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Assuming you're using lucide-react for the icons

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState("loading...");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // This effect will run when the location path changes, ensuring that the user info is updated accordingly
  useEffect(() => {
    if (location.pathname !== "/" && location.pathname !== "/search") {
      const interval = setInterval(() => {
        const name = localStorage.getItem("name");
        if (name) {
          setCurrentUser(name);
          clearInterval(interval); // Stop checking once we have the name
        } else {
          setCurrentUser("unknown user");
        }
      }, 100);

      return () => clearInterval(interval); // Cleanup the interval on unmount or path change
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/", { replace: true }); // Redirect to the home page after logging out
    window.location.reload(); // Optionally reload the page to reset the state
  };

  const showUserInfo = location.pathname !== "/" && location.pathname !== "/search";

  return (
    <header className="bg-[#E5870D] shadow-lg p-2">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/AB.png?alt=media&token=15eb34e1-18f5-4fa5-8d67-c82d23e5d6ab"
              alt="Sri Kalki Events Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
            <h1 className="font-bold text-2xl text-white hidden sm:block">Sri Kalki Events</h1>
          </div>

          {/* Show user info and logout button on non-home and non-search paths */}
          {showUserInfo && (
            <div className="hidden md:flex items-center space-x-4">
              <p className="text-white font-medium">
                You&apos;re paying for: <span className="font-bold">{currentUser}</span>
              </p>
              <button
                onClick={handleLogout}
                className="bg-white text-[#E5870D] font-semibold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                Pay for a different user
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile view of user info and logout button */}
        {showUserInfo && isMenuOpen && (
          <div className="mt-4 md:hidden">
            <p className="text-white font-medium mb-2">
              You&apos;re paying for: <span className="font-bold">{currentUser}</span>
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-white text-[#E5870D] font-semibold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              Pay for a different user
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
