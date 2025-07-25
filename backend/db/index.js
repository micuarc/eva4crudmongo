const fs = require("fs");
const tls = require("tls");
const { MongoClient } = require("mongodb");
const {
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_SERVICE_NAME,
  DB_CA_PEM,
  DB_CLIENT_CRT,
  DB_CLIENT_KEY,
  VOLUME_BASE_PATH,
} = process.env;

const uri = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_SERVICE_NAME}:27017/${DB_NAME}`;
const secureContext = tls.createSecureContext({
  ca: fs.readFileSync(VOLUME_BASE_PATH + DB_CA_PEM),
  cert: fs.readFileSync(VOLUME_BASE_PATH + DB_CLIENT_CRT),
  key: fs.readFileSync(VOLUME_BASE_PATH + DB_CLIENT_KEY),
});

const client = new MongoClient(uri, { tls: true, secureContext });

let db;

async function connectDB() {
  try {
    console.log("mongo connecting...");
    await client.connect();
    console.log("mongo connected");
    db = client.db(DB_NAME);
    return db;
  } catch (err) {
    console.error("Error con al conexión a Db:", err);
  }
}

module.exports = { connectDB, getDB: () => db, client };
