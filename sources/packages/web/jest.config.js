module.exports = {
  preset: "@vue/cli-plugin-unit-jest/presets/typescript-and-babel",
  transform: {
    "^.+\\.vue$": "vue3-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!primevue)"],
  globals: {
    "ts-jest": {
      babelConfig: "babel.config.js",
      diagnostics: {
        warnOnly: true,
      },
    },
  },
};
