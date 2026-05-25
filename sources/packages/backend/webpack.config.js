import CopyPlugin from "copy-webpack-plugin";
export const devtool =
  process.env.DEBUG === "true" ? "eval-source-map" : "source-map";
// Persist the module graph and compiled assets to disk so that subsequent
// builds (watch mode restarts, re-runs) skip re-processing unchanged modules.
export const cache = {
  type: "filesystem",
};
export const plugins = [
  new CopyPlugin({
    patterns: [
      {
        from: "libs/src-sql",
        to: "libs/src-sql",
      },
    ],
  }),
];
