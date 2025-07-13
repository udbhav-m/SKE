import React from "react";
import { useEffect, useState } from "react";
import Tabs from "../components/Tabs";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig";
import Loader from "../components/loader";

function Home() {
  const types = ["Unregistered Events", "Registered Events"];
  const docId = localStorage.getItem("docId");
  const phone = localStorage.getItem("phone");
  const email = localStorage.getItem("email");
  const [unRegisteredEvents, setUnRegisteredEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [userCourses, setCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [userPayments, setUserPayments] = useState([]);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  async function getUser() {
    const userDocRef = doc(db, "users", docId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.phone === "+91" + phone || data.email === email) {
        localStorage.setItem("name", data.name);
        setCourses(data.courses || []);
        setPendingCourses(data.pending || []);
        await getUserPayments();
      }
    }
    setIsUserLoaded(true);
  }

  async function getUserPayments() {
    const paymentsCollection = collection(db, `users/${docId}/user_payments`);
    const paymentDocs = await getDocs(paymentsCollection);
    const payments = paymentDocs.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        updatedDate: data.updatedDate
          ? new Date(data.updatedDate.seconds * 1000).toLocaleString()
          : null,
      };
    });

    setUserPayments(payments);
  }

  async function getAllCourses() {
    const querySnapshot = await getDocs(collection(db, "events"));
    const allInEvents = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
    const allEvents = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (event) =>  event.payment_gateway_website && (event.EF || event.active) && !event.pj_web_status
        
      );

    const registered = allInEvents.filter((event) =>
      userCourses.includes(event.id)
    ).sort((a, b) => b?.created_on - a?.created_on);
    console.log("reg", registered)

    const unregistered = allEvents.filter(
      (event) => !userCourses.includes(event.id)
    );

    setRegisteredEvents(registered);
    setUnRegisteredEvents(unregistered);
  }

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (isUserLoaded) {
      getAllCourses();
    }
  }, [isUserLoaded]);

  if (!isUserLoaded) {
    return <Loader />;
  }

  return (
    <div>
      <Tabs
        types={types}
        registeredCourses={registeredEvents}
        unregisteredCourses={unRegisteredEvents}
        pendingCourses={pendingCourses}
        userPayments={userPayments}
      />
    </div>
  );
}

export default Home;
