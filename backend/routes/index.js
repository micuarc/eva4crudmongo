const express = require("express");
const serverResponses = require("../utils/helpers/responses");
const { getDB } = require("../db/index.js");
const clientesRouter = require("./clientes");
const productosRouter = require("./productos");
const pedidosRouter = require("./pedidos");
const joinQueriesRouter = require("./joinQueries");

const routes = (app) => {
  let router = express.Router();
  const db = getDB();

  // router.get("/", async (req, res) => {
  //   try {
  //     const [clientes, productos, pedidos] = await Promise.all([
  //       db.collection("Clientes").find({}).toArray(),
  //       db.collection("Productos").find({}).toArray(),
  //       db.collection("Pedidos").find({}).toArray(),
  //     ]);
  //     return res.status(200).send({ clientes, productos, pedidos });
  //   } catch (err) {
  //     serverResponses.sendError(res, messages.SERVER_ERROR, err);
  //   }
  // });
  //subrutas poor coleccion
  app.use("/api/clientes", clientesRouter);
  app.use("/api/productos", productosRouter);
  app.use("/api/pedidos", pedidosRouter);
  app.use("/api/joinQueries", joinQueriesRouter);
  // app.use("/api", router);
  return router;
};

module.exports = routes;
