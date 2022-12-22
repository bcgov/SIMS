const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
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
