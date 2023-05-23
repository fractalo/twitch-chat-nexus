/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/components/**/*.{html,js,svelte,ts}',
    './src/options/**/*.{html,js,svelte,ts}',
    './src/popup/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "color-scheme": "light",
          primary: "#9147ff",
          "primary-content": "#ffffff",
          secondary: "#f000b8",
          "secondary-content": "#ffffff",
          accent: "#37cdbe",
          "accent-content": "#163835",
          neutral: "#3d4451",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#F2F2F2",
          "base-300": "#E5E6E6",
          "base-content": "#1f2937",
        }
      }, 
      {
        dark: {
          "color-scheme": "dark",
          primary: "#7c3de3",
          "primary-content": "#ffffff",
          secondary: "#D926AA",
          "secondary-content": "#ffffff",
          accent: "#1FB2A5",
          "accent-content": "#ffffff",
          neutral: "#27272d",
          "neutral-focus": "#111318",
          "neutral-content": "#ffffff",
          "base-100": "#18181b",
          "base-200": "#1f1f23",
          "base-300": "#26262c",
          "base-content": "#efeff1",
        }
      }
    ],
    darkTheme: null,
  },
}
