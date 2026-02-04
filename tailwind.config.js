/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Ana arka plan - Derin Okyanus/Antrasit
        background: "#0F0A1E",
        // Kart arka planı
        card: "#1E1B2E",
        // Marka rengi - Elektrik Moru
        primary: "#7C3AED",
        // Tehlike/İfşa - Neon Fuşya
        danger: "#EC4899",
        // Güven - Neon Zümrüt
        success: "#10B981",
        // Border rengi
        border: "rgba(255, 255, 255, 0.1)",
      },
    },
  },
  plugins: [],
};
