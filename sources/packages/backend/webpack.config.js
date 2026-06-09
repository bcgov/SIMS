const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
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
  resolve: {
    alias: {
      "@sims/sims-db": path.resolve(__dirname, "libs/sims-db/src"),
      "@sims/services": path.resolve(__dirname, "libs/services/src"),
      "@sims/utilities": path.resolve(__dirname, "libs/utilities/src"),
      "@sims/test-utils": path.resolve(__dirname, "libs/test-utils/src"),
      "@sims/integrations": path.resolve(__dirname, "libs/integrations/src"),
      "@sims/auth": path.resolve(__dirname, "libs/auth/src"),
    },
    extensions: [".ts", ".js", ".json"],
  },
};
