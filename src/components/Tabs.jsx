import { useEffect, useState } from "react";
import TabButton from "./TabButton";

import Course from "./Course";
import { useNavigate } from "react-router-dom";

function Tabs({ types, courses }) {
  const [isActive, setIsActive] = useState(0);
  const [unReg, setUnReg] = useState(true);
  const [registeredCourses, setRegistered] = useState();
  const [unregisteredCourses, setUnregistered] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    const tUnReg = courses.filter((each) => each?.registered === false);
    const tReg = courses.filter((each) => each?.registered === true);
    setUnregistered(tUnReg);
    setRegistered(tReg);
  }, [courses]);

  return (
    <>
      <div className="flex gap-10 p-2">
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
        } space-y-2 p-4 transition-all duration-100  `}
      >
        {unregisteredCourses &&
          unregisteredCourses.map((course) => {
            return (
              <Course
                name={course?.name}
                description={course?.description}
                date={course?.date}
                label={"Pay-now"}
                onClick={() => navigate(`/register/${course?.name}`)}
              />
            );
          })}
      </div>
      <div
        className={`${
          !unReg ? "visible" : "hidden"
        } space-y-2 p-4 transition-all duration-100`}
      >
        {registeredCourses &&
          registeredCourses.map((course) => {
            return (
              <Course
                name={course?.name}
                description={course?.description}
                date={course?.date}
                label={"Download receipt"}
              />
            );
          })}
      </div>
    </>
  );
}

export default Tabs;
