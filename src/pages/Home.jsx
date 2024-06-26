import Tabs from "../components/Tabs";

function Home() {
  let courses = [
    {
      name: "Arogya Pooja",
      description: "A dummy description",
      date: "13th July 2024",
      registered: false,
    },
    {
      name: "Aishwarya Pooja",
      description: "A dummy description",
      date: "13th July 2024",
      registered: false,
    },
    {
      name: "Brain Pooja",
      description: "A dummy description",
      date: "13th July 2024",
      registered: true,
    },
    {
      name: "Mukthi & moksha",
      description: "A dummy description",
      date: "13th July 2024",
      registered: false,
    },
  ];
  const types = ["Unregistered Events", "Registered Events"];
  return (
    <div>
      <Tabs types={types} courses={courses} />
    </div>
  );
}

export default Home;
