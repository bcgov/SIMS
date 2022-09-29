const path = require("path");

console.log("+++++++++++++++++++++DIR NAME+++++++++++++++++++++");
console.log(__dirname);

if (
  process.env.NODE_ENV !== "production" ||
  process.env.NODE_ENV !== "docker"
) {
  require("dotenv").config({
    path: path.resolve(__dirname, "../../../../../../.env"),
  });
}

module.exports = () => {};
