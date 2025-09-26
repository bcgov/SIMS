import CopyPlugin from "copy-webpack-plugin";
export const devtool =
  process.env.DEBUG === "true" ? "inline-source-map" : "source-map";
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
