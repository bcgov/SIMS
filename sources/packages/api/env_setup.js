const path = require("path");
if (process.env.NODE_ENV === "local") {
  require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
}

module.exports = () => { };