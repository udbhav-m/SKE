import HButton from "./HButton";

function Course({ name, description, date, label, onClick }) {
  return (
    <div className=" shadow-lg rounded w-12/12 p-4 flex justify-between items-center border border-custom-brown hover:bg-primary hover:bg-opacity-10 transition-all duration-200">
      <div className="space-y-2">
        <h1>
          <b>{name}</b>
        </h1>
        <h1>{date}</h1>
        <h1>{description}</h1>
      </div>
      <div className=" ">
        <HButton onClick={onClick} label={label} />
      </div>
    </div>
  );
}

export default Course;
