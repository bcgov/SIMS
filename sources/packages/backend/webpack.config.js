const CopyPlugin = require("copy-webpack-plugin");
module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "apps/queue-consumers/src-sql",
          to: "apps/queue-consumers/src-sql",
        },
      ],
    }),
  ],
};
// todo: ann check with andrew
