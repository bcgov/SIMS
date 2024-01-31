const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  devtool: "source-map",
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
