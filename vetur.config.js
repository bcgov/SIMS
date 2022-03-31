// vetur.config.js
/** @type {import('vls').VeturConfig} */
module.exports = {
  settings: {
    "vetur.useWorkspaceDependencies": true,
    "vetur.experimental.templateInterpolationService": true,
    "vetur.validation.interpolation": false,
  },
  projects: [
    "./sources/packages/web", // shorthand for only root.
  ],
};
