import { useEffect, useState } from "react";
import Tabs from "../components/Tabs";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import Loader from "../components/loader";

function Home() {
  const types = ["Unregistered Events", "Registered Events"];
  const docId = localStorage.getItem("docId");
  const phone = localStorage.getItem("phone");
  const email = localStorage.getItem("email");
  const [unRegisteredEvents, setUnRegisteredEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [userCourses, setCourses] = useState([]); // State to hold user courses
  const [userPayments, setUserPayments] = useState([]); // State to hold user payments
  const [isUserLoaded, setIsUserLoaded] = useState(false); // New state to track user loading

  async function getUser() {
    const userDocRef = doc(db, "users", docId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.phone === "+91" + phone || data.email === email) {
        localStorage.setItem("name", data.name);
        setCourses(data.courses || []); // Set user courses
        await getUserPayments(); // Fetch payments after setting courses
      }
    }
    setIsUserLoaded(true); // Set user data as loaded
  }

  async function getUserPayments() {
    const paymentsCollection = collection(db, `users/${docId}/user_payments`);
    const paymentDocs = await getDocs(paymentsCollection);
    const payments = paymentDocs.docs.map((doc) => {
      const data = doc.data();
      // Check for timestamp fields and convert them
      return {
        id: doc.id,
        ...data,
        updatedDate: data.updatedDate
          ? new Date(data.updatedDate.seconds * 1000).toLocaleString()
          : null,
      };
    });

    setUserPayments(payments); // Store user payments in state
  }

  async function getAllCourses() {
    const querySnapshot = await getDocs(collection(db, "events"));
    const allEvents = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((event) => event.active && event.payment_gateway);

    const registered = allEvents.filter((event) =>
      userCourses.includes(event.id)
    );

    const unregistered = allEvents.filter(
      (event) => !userCourses.includes(event.id)
    );

    setRegisteredEvents(registered);
    setUnRegisteredEvents(unregistered);
  }

  // Fetch user data only once
  useEffect(() => {
    getUser();
  }, []);

  // Fetch courses once userCourses is updated
  useEffect(() => {
    if (userCourses.length > 0) {
      getAllCourses();
    }
  }, [userCourses]); // Only trigger when userCourses is updated

  // Fetch courses after user data is loaded
  useEffect(() => {
    if (isUserLoaded) {
      getAllCourses();
    }
  }, [isUserLoaded]); // Fetch courses once the user data is loaded

  if (!isUserLoaded) {
    return <Loader />;
  }

  return (
    <div>
      <Tabs
        types={types}
        registeredCourses={registeredEvents}
        unregisteredCourses={unRegisteredEvents}
        userPayments={userPayments}
      />
    </div>
  );
}

export default Home;
