const CopyPlugin = require("copy-webpack-plugin");
const exports = {
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
if (process.env.NODE_ENV === "production") {
  // Enable the source maps needed to support proper stack trace errors in production
  // pointing to typescript files (.ts) instead of javascript (.js) references.
  exports.devtool = "source-map";
}
module.exports = exports;
