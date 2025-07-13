// InputField.js
const InputField = ({
  label,
  type = "text",
  placeholder,
  value,
  hasError,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className={`mt-1 p-3 w-full rounded-md border shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50  ${
          hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-200"
        }`}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

export default InputField;
