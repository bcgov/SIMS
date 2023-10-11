const path = require("path");
const GlobEntries = require("webpack-glob-entries");

module.exports = {
  mode: "production",
  entry: GlobEntries("./src/**/*.test.ts"), // Generates multiple entries for each test.
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    path: path.join(__dirname, "dist"),
    libraryTarget: "commonjs",
    filename: "[name].js",
  },
  target: "web",
  externals: /^(k6|https?:\/\/)(\/.*)?/,
  devtool: "source-map",
  optimization: {
    minimize: true,
  },
};
