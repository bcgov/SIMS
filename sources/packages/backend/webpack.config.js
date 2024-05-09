const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  // Enable the source maps needed to support proper stack trace errors in production
  // pointing to typescript files (.ts) instead of javascript (.js) references.
  // DEBUG is set as 'true' only when using start:debug' script.
  devtool: process.env.DEBUG === "true" ? "inline-source-map" : "source-map",
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "libs/src-sql",
          to: "libs/src-sql",
        },
      ],
    }),
  ],
};
