import { useEffect, useState } from "react";
import TabButton from "./TabButton";

import Course from "./Course";
import { useNavigate } from "react-router-dom";

function Tabs({ types, registeredCourses, unregisteredCourses }) {
  const [isActive, setIsActive] = useState(0);
  const [unReg, setUnReg] = useState(true);
  const navigate = useNavigate();

  return (
    <>
      <div className="flex gap-10 p-2 mx-16">
        {types.map((each, index) => (
          <TabButton
            type={each}
            isActive={index === isActive}
            onClick={() => {
              setIsActive(index);
              each == "Unregistered Events" ? setUnReg(true) : setUnReg(false);
            }}
          />
        ))}
      </div>
      <div
        className={`${
          unReg ? "visible" : "hidden"
        } p-4 transition-all duration-100 flex justify-between flex-wrap gap-4 mx-16 `}
      >
        {unregisteredCourses &&
          unregisteredCourses.map((course) => {
            return (
              <Course
                image={course?.image}
                name={course?.name}
                description={course?.description}
                date={course?.date_time}
                label={"Pay now"}
                onClick={() => {
                  navigate(`/register/${course?.id}`, {
                    state: { courseDetails: course },
                  });
                  // localStorage.setItem(courseName, course.name);
                  // localStorage.setItem(amount, course.inr_amount);
                }}
              />
            );
          })}
      </div>
      <div
        className={`${
          !unReg ? "visible" : "hidden"
        } p-4 transition-all duration-100 flex flex-wrap gap-4`}
      >
        {registeredCourses &&
          registeredCourses.map((course) => {
            return (
              <Course
                image={course?.image}
                name={course?.name}
                description={course?.description}
                date={course?.date_time}
                label={"Download receipt"}
              />
            );
          })}
      </div>
    </>
  );
}

export default Tabs;
