import { useState } from "react";
import TabButton from "./TabButton";
import Course from "./Course";
import { useNavigate } from "react-router-dom";

// Format utility function
const formatDateTime = (timestamp) => {
  if (!timestamp) return null; // Handle null or undefined timestamps
  const date = new Date(timestamp.seconds * 1000); // Convert Firestore timestamp to JavaScript Date
  return date.toLocaleString("en-IN", {
    // Format date as needed
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

function Tabs({ types, registeredCourses, unregisteredCourses, userPayments }) {
  const [isActive, setIsActive] = useState(0);
  const [unReg, setUnReg] = useState(true);
  const navigate = useNavigate();

  const handleDownloadPDF = (courseId) => {
    const paymentData = userPayments.find(
      (payment) => payment.courseId === courseId
    );
    if (paymentData) {
      navigate("/receipt", { state: { receiptData: paymentData } });
    }
  };
  

  return (
    <>
      <div className="flex gap-10 p-2 mx-16">
        {types.map((each, index) => (
          <TabButton
            key={index}
            type={each}
            isActive={index === isActive}
            onClick={() => {
              setIsActive(index);
              each === "Unregistered Events" ? setUnReg(true) : setUnReg(false);
            }}
          />
        ))}
      </div>
      <div
        className={`${
          unReg ? "visible" : "hidden"
        } p-4 transition-all duration-100 flex flex-wrap gap-4 mx-16`}
      >
        {unregisteredCourses &&
          unregisteredCourses.map((course) => (
            <Course
              key={course?.id}
              image={course?.image}
              name={course?.name}
              description={course?.description}
              date={formatDateTime(course?.date_time)} // Format date_time here
              label={"Pay now"}
              onClick={() => {
                navigate(`/register/${course?.id}`, {
                  state: { courseDetails: course },
                });
              }}
            />
          ))}
      </div>
      <div
        className={`${
          !unReg ? "visible" : "hidden"
        } p-4 transition-all duration-100 flex flex-wrap gap-4 mx-16`}
      >
        {registeredCourses &&
          registeredCourses.map((course) => (
            <Course
              key={course?.id}
              image={course?.image}
              name={course?.name}
              description={course?.description}
              date={formatDateTime(course?.date_time)} // Format date_time here
              label={"View receipt"}
              onClick={() => handleDownloadPDF(course?.id)}
            />
          ))}
      </div>
    </>
  );
}

export default Tabs;
