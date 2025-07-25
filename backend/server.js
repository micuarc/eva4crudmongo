// server.js
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const { getDB, connectDB } = require("./db");

const app = express();

async function startServer() {
  try {
    await connectDB();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, "public")));
    require("./routes")(app);
    app.listen(3000);
  } catch (error) {
    console.error("Error al conectar con BD:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
