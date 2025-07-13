// SelectField.js
import { ChevronDown } from "lucide-react";

const SelectField = ({ label, value, onChange, hasError, options }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="">
        <select
          className={`w-full p-3 rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 appearance-none ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-indigo-200"
          }`}
          value={value}
          onChange={onChange}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default SelectField;
