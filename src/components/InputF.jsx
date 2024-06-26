function InputF({ label, type, placeholder, onChange }) {
  return (
    <>
      <div className=" flex justify-between items-center text-center gap-2">
        <h1 className="font-medium text-">{label}</h1>
        <input
          className="rounded-md border w-80 p-1.5 "
          onChange={onChange}
          type={type}
          placeholder={placeholder}
        />
      </div>
    </>
  );
}

export default InputF;
