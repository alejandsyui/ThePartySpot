/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,svelte}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#E11D48",
          teal: "#0EA5A4",
          slate: "#0F172A"
        }
      },
      fontFamily: {
        heading: ["'Inter'", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        body: ["'Roboto'", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"]
      }
    }
  },
  plugins: []
};
