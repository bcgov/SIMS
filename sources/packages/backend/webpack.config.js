import CopyPlugin from "copy-webpack-plugin";
import { TsconfigPathsPlugin } from "tsconfig-paths-webpack-plugin";

export const devtool =
  process.env.DEBUG === "true" ? "inline-source-map" : "source-map";

export const resolve = {
  extensions: [".ts", ".js", ".json"],
  plugins: [
    new TsconfigPathsPlugin({
      configFile: "./tsconfig.json",
    }),
  ],
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
