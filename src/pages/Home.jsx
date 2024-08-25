import { useEffect, useState } from "react";
import Tabs from "../components/Tabs";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../firebase/firebaseConfig";
const docs = [
  {
    id: "002oJ4AZ7BKNuu05ZIQdQCkFMvOW",
    name: "Minakshi Mitra",
    phone: "+918130944399",
    courses: ["15cfc1c3-5b72-4240-9049-9e70ba85cd47", "new_cod"],
  },
  {
    id: "00lvyQ6FgkXnNIeGeg1KqODvIq52",
    name: "Karthini",
    email: "kartheniramasamy@gmail.com",
    courses: ["15cfc1c3-5b72-4240-9049-9e70ba85cd47", "new_cod"],
  },
];

function Home() {
  const types = ["Unregistered Events", "Registered Events"];
  const docId = localStorage.getItem("docId");
  const phone = localStorage.getItem("phone");
  const email = localStorage.getItem("email");
  const [unRegisteredEvents, setUnRegisteredEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [userCourses, setCourses] = useState([]);

  async function getUser() {
    // const docs = await getDocs(collection(db, "users"));
    docs.forEach((doc) => {
      // let data = doc.data();
      let data = doc;
      if (
        doc.id == docId &&
        (data.phone == "+91" + phone || data.email == email)
      ) {
        localStorage.setItem("name", data.name);
        setCourses(data.courses || []);
      }
    });
  }

  let allEvents = [
    {
      id: "1a4a9cd6-974e-4f43-ba36-6ed5fbb13742",
      active: true,
      date_time: "February 8, 2022 at 12:00:00 PM UTC+5:30",
      description: "NA",
      image:
        "https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/CourseImages%2F21Feb2022190352?alt=media&token=997ef42d-9122-4704-8a36-112897b3d514",

      inr_amount: 1,
      name: "Puspha Yagam 1",
      payment_gateway: true,
    },
    {
      id: "1a4a9cd6-974e-4f43-ba36-6ed5fbb13742",
      active: true,
      date_time: "February 8, 2022 at 12:00:00 PM UTC+5:30",
      description: "NA",
      image:
        "https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/CourseImages%2F21Feb2022190352?alt=media&token=997ef42d-9122-4704-8a36-112897b3d514",

      inr_amount: 1,
      name: "Course 2",
      payment_gateway: true,
    },
    {
      id: "1a4a9cd6-974e-4f43-ba36-6ed5fbb13742",
      active: true,
      date_time: "February 8, 2022 at 12:00:00 PM UTC+5:30",
      description: "NA",
      image:
        "https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/CourseImages%2F21Feb2022190352?alt=media&token=997ef42d-9122-4704-8a36-112897b3d514",

      inr_amount: 1,
      name: "Course 3",
      payment_gateway: true,
    },
    {
      id: "1a4a9cd6-974e-4f43-ba36-6ed5fbb13742",
      active: true,
      date_time: "February 8, 2022 at 12:00:00 PM UTC+5:30",
      description: "NA",
      image:
        "https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/CourseImages%2F21Feb2022190352?alt=media&token=997ef42d-9122-4704-8a36-112897b3d514",

      inr_amount: 1,
      name: "Course 4",
      payment_gateway: true,
    },
    {
      id: "1a4a9cd6-974e-4f43-ba36-6ed5fbb13742",
      active: true,
      date_time: "February 8, 2022 at 12:00:00 PM UTC+5:30",
      description: "NA",
      image:
        "https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/CourseImages%2F21Feb2022190352?alt=media&token=997ef42d-9122-4704-8a36-112897b3d514",

      inr_amount: 1,
      name: "Course 5",
      payment_gateway: true,
    },
    {
      id: "15cfc1c3-5b72-4240-9049-9e70ba85cd47",
      active: true,
      date_time: "February 8, 2022 at 12:00:00 PM UTC+5:30",
      description: "NA",
      image:
        "https://firebasestorage.googleapis.com/v0/b/abeventsdev.appspot.com/o/CourseImages%2F21Feb2022190352?alt=media&token=997ef42d-9122-4704-8a36-112897b3d514",

      inr_amount: 1,
      name: "Brought course",
      payment_gateway: true,
    },
  ];

  async function getAllCourses() {
    // const querySnapshot = await getDocs(collection(db, "events"));
    // const allEvents = querySnapshot.docs
    //   .map((doc) => ({ id: doc.id, ...doc.data() }))
    //   .filter((event) => event.active);

    const registered = allEvents.filter((event) =>
      userCourses.includes(event.id)
    );

    const unregistered = allEvents.filter(
      (event) => !userCourses.includes(event.id)
    );

    setRegisteredEvents(registered);
    setUnRegisteredEvents(unregistered);
    console.log(registeredEvents);
  }

  useEffect(() => {
    const fetchData = async () => {
      await getUser();
      getAllCourses();
    };

    fetchData();
  }, [userCourses]);

  return (
    <div>
      <Tabs
        types={types}
        registeredCourses={registeredEvents}
        unregisteredCourses={unRegisteredEvents}
      />
    </div>
  );
}

export default Home;
