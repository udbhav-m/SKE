// InputField.js
const InputField = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-1 p-3 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};

export default InputField;
