/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        'screen': '100vw',
      },
      colors: {
        resbar: {
          cream: "#E8E3D8",
          beige: "#D8D2C4",
          taupe: "#8A8174",

          charcoal: "#3A3A3A",
          softblack: "#1F1F1F",

          gold: {
            light: "#C6B57A",
            DEFAULT: "#B7A46A",
            dark: "#9C8653"
          },

          amber: "#C9822B"
        }
      },

      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Lora", "serif"]
      },

      boxShadow: {
        card: "0px 4px 12px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
