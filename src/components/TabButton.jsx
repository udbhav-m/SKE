function TabButton({ type, isActive, onClick }) {
  return (
    <div>
      <div className={`cursor-pointer p-2 `} onClick={onClick}>
        <h1
          className={`transition-all transform duration-100 border-b-4 ${
            isActive
              ? " text-custom-brown border-b-4 border-custom-brown rounded-sm scale-105 "
              : " border-transparent"
          }  cursor-pointer p-2 text-lg font-semibold`}
        >
          {type}
        </h1>
      </div>
    </div>
  );
}

export default TabButton;
