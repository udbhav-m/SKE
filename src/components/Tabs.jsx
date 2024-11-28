import { useState, useEffect } from "react";
import TabButton from "./TabButton";
import Course from "./Course";
import { useLocation, useNavigate } from "react-router-dom";

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

function Tabs({
  types,
  registeredCourses,
  unregisteredCourses,
  pendingCourses,
  userPayments,
}) {
  const [isActive, setIsActive] = useState(0);
  const [unReg, setUnReg] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#registered-events") {
      setIsActive(1);
      setUnReg(false);
    } else {
      setIsActive(0);
      setUnReg(true);
    }
  }, [location]);

  function handleOnPay(course) {
    navigate(`/register/${course?.id}`, {
      state: { courseDetails: course },
    });
  }

  const handleDownloadPDF = (course) => {
    const paymentData = userPayments.find(
      (payment) => payment.courseId === course.id
    );

    if (paymentData) {
      paymentData.courseName = course.name;

      if (!paymentData.amount) {
        paymentData.amount = course.inr_amount;
      }

      navigate("/receipt", { state: { receiptData: paymentData } });
    }
  };

  const isPending = (courseId) => pendingCourses.includes(courseId);

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
              date={formatDateTime(course?.date_time)} 
              label={isPending(course.id) ? "Pending" : "Pay now"}
              onClick={isPending(course.id) ? null : () => handleOnPay(course)} 
              disabled={isPending(course.id)} 
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
              date={formatDateTime(course?.date_time)} 
              label={"View receipt"}
              onClick={() => handleDownloadPDF(course)}
            />
          ))}
      </div>
    </>
  );
}

export default Tabs;
