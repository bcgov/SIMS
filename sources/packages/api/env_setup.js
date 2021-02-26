const path = require("path");
if (process.env.NODE_ENV !== "production" || process.env.NODE_ENV !== "docker") {
  require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
}

module.exports = () => { };