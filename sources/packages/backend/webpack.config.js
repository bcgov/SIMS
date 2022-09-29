const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "apps/api/src-sql",
          to: "apps/api/src-sql",
        },
      ],
    }),
  ],
};
