import HButton from "./HButton";

function Course({ image, name, description, date, label, onClick }) {
  return (
    <div className=" md:w-5/12 lg:w-96 lg:max-w-[26rem] shadow-2xl rounded-md items-center hover:bg-primary hover:bg-opacity-10 transition-all duration-200 transform hover:scale-95">
      <img className="rounded-t-md w-full h-[16rem] " src={image} alt="Course image" />
      <div className="space-y-2 p-4 ">
        <h1>
          <b>{name}</b>
        </h1>
        <h1>{date}</h1>
        <h1>{description}</h1>
      </div>
      <div className="p-2">
        <HButton onClick={onClick} label={label} />
      </div>
    </div>
  );
}

export default Course
