const express = require("express");
const { getDB, connectDB } = require("../db");
const router = express.Router();
const db = getDB();
const collection = db.collection("Productos");

//CREATE:
router.post("/", async (req, res) => {
  const body = req.body;
  const doc = {
    _id: body._id,
    nombre: body.nombre,
    precio: ParseInt(body.precio),
    stock: ParseInt(body.stock),
    fecha_vencimiento: new Date(body.fecha_vencimiento),
    estado: body.estado,
  };
  const result = await collection.insertOne(doc);
  res.status(201).send(result);
});

// READ: todos los productos
router.get("/", async (req, res) => {
  const resultados = await collection.find({}).toArray();
  res.status(200).send(resultados);
});

//READ: por ID de producto
// READ: por ID de cliente
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: id };
    const resultado = await collection.findOne(consulta);
    if (!resultado)
      res.status(404).send("No se encontro un producto con ese id!");
    else res.status(200).send(resultado);
  } catch (err) {
    res.status(400).send("Id invalido!");
  }
});

// ...

// UPDATE
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: id };
    const body = req.body;
    const modificaciones = {
      $set: {
        nombre: body.nombre,
        precio: ParseInt(body.precio),
        stock: ParseInt(body.stock),
        fecha_vencimiento: new Date(body.fecha_vencimiento),
      },
    };
    const resultado = await collection.updateOne(consulta, modificaciones);
    res.status(200).send(resultado);
  } catch (err) {
    console.error("ERROR EN PATCH: ", err);
    res.status(500).send("Error al modificar un producto!");
  }
});

// UPDATE/DELETE: cambiar estado
router.patch("/cambiar_estado/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: id };
    const body = req.body;
    const modificaciones = {
      $set: {
        estado: body.estado,
      },
    };
    const resultado = await collection.updateOne(consulta, modificaciones);
    res.status(200).send(resultado);
  } catch (err) {
    console.error("ERROR EN PATCH: ", err);
    res.status(500).send("Error al cambiar el estado de un producto!");
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: id };
    const resultado = await collection.deleteOne(consulta);
    res.status(200).send(resultado);
  } catch (err) {
    console.error("ERROR EN DELETE:", err);
    res.status(500).send("Error al eliminar un cliente!");
  }
});

module.exports = router;
