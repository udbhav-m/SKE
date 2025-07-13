/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "custom-brown": "#843C0C",
        primary: "#E5870D",
        secondary: "#fbf7d2",
      },
    },
  },
  plugins: [],
};

