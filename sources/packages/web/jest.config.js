module.exports = {
  preset: "@vue/cli-plugin-unit-jest/presets/typescript-and-babel",
  transform: {
    "^.+\\.vue$": "vue-jest",
  },
  globals: {
    "ts-jest": {
      babelConfig: "babel.config.js",
      diagnostics: {
        warnOnly: true,
      },
    },
  },
};
