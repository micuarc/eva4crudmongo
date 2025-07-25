const express = require("express");
const { getDB, connectDB } = require("../db");
const router = express.Router();
const db = getDB();

// todos los pedidos de un cliente
router.get("/segun-cliente", async (req, res) => {
  try {
    const resultado = await db
      .collection("Pedidos")
      .aggregate([
        {
          $lookup: {
            from: "Clientes",
            localField: "id_cliente",
            foreignField: "_id",
            as: "cliente",
          },
        },
        {
          $unwind: "$cliente",
        },
      ])
      .toArray();
    res.status(200).send(resultado);
  } catch (err) {
    res.status(500).send("error al consultar los pedidos de un cliente");
  }
});

// todos los productos de un pedido, consultandolos por su id
router.get("/productos-de-pedido/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const pedido = await db.collection("Pedidos").findOne({ _id: id });
    if (!pedido) return res.status(404).send("el pedido no fue encontrado");

    const idsProductos = pedido.productos.map((p) => p.id_producto);
    const productos = await db
      .collection("Productos")
      .find({ _id: { $in: idsProductos } })
      .toArray();

    res.status(200).send({ pedido, productos });
  } catch (err) {
    res.status(500).send("error en la consutla de productos por pedido!");
  }
});

module.exports = router;
