const path = require("path");
const filename = path.join(__dirname, "../../logs/project.log");

const log = require("simple-node-logger").createSimpleLogger({
  logFilePath: filename,
  timestampFormat: "DD-MM-YYYY HH:mm:ss",
});
module.exports = { log };
