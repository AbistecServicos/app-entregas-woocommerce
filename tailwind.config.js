/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // ← Mantenha esta linha também
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // ← Mantenha esta linha também
  ],
  theme: {
    extend: {
      colors: {
        woo: {
          purple: '#7f54b3',
          purpleDark: '#6b3fa0', 
          purpleLight: '#f0e6ff',
        }
      }
    },
  },
  plugins: [],
}