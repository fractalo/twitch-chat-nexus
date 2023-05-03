/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    './src/content/**/*.{html,js,svelte,ts}',
    './src/injected/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    styled: true,
    themes: [
      { 
        dummyTheme: {}
      },
      {
        "daisy-light": {
          "color-scheme": "light",
          primary: "#9147ff",
          "primary-focus": "#772ce8",
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
        "daisy-dark": {
          "color-scheme": "dark",
          primary: "#9147ff",
          "primary-focus": "#772ce8",
          "primary-content": "#ffffff",
          secondary: "#D926AA",
          "secondary-content": "#ffffff",
          accent: "#1FB2A5",
          "accent-content": "#ffffff",
          neutral: "#191D24",
          "neutral-focus": "#111318",
          "neutral-content": "#A6ADBB",
          "base-100": "#18181b",
          "base-200": "#242933",
          "base-300": "#20252E",
          "base-content": "#efeff1",
        }
      },
    ],
    base: false,
    darkTheme: null,
    prefix: "daisy-"
  },
  corePlugins: {
    preflight: false,
  },
}
