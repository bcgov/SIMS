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
  exports.devtool = "source-map";
}
module.exports = exports;
