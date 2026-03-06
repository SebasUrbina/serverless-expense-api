/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter_400Regular", "sans-serif"],
        medium: ["Inter_500Medium", "sans-serif"],
        semibold: ["Inter_600SemiBold", "sans-serif"],
        bold: ["Inter_700Bold", "sans-serif"],
        extrabold: ["Inter_800ExtraBold", "sans-serif"],
      },
    },
  },
  plugins: [],
}
