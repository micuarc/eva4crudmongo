const express = require("express");
const { getDB, connectDB } = require("../db");
const router = express.Router();
const db = getDB();
const collection = db.collection("Clientes");

// CREATE
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    const doc = {
      _id: parseInt(body._id),
      nombres: body.nombres,
      apellidos: body.apellidos,
      direccion: {
        calle: body.direccion?.calle,
        numero: body.direccion?.numero,
        departamento: body.direccion?.departamento ?? null,
        ciudad: body.direccion?.ciudad,
      },
      fecha_registro: new Date(body.fecha_registro),
    };
    const resultado = await collection.insertOne(doc);
    res.status(201).send(resultado);
  } catch (err) {
    console.error("ERROR: ", err);
    res.status(500).send("Error al añadir un cliente");
  }
});

////////////////////////////////////

// READ: todos los clientes
router.get("/", async (req, res) => {
  const resultados = await collection.find({}).toArray();
  res.status(200).send(resultados);
});

// READ: clientes por ciudad específica
router.get("/ciudad/:nombreCiudad", async (req, res) => {
  const ciudad = req.params.nombreCiudad;
  const consulta = { "direccion.ciudad": ciudad };
  const resultados = await collection.find(consulta).toArray();
  if (resultados.length === 0) {
    res.status(404).send("No hay resultados para esa ciudad. Intente con otra");
  } else {
    const ids = resultados.map((doc) => doc._id);
    res.status(200).send(ids);
  }
});

// READ: por ID de cliente
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: parseInt(id) };
    const resultado = await collection.findOne(consulta);
    if (!resultado)
      res.status(404).send("No se encontro un cliente con ese id!");
    else res.status(200).send(resultado);
  } catch (err) {
    console.log(err);
    res.status(400).send("Id invalido!");
  }
});

////////////////////////////////////

// UPDATE
router.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: id };
    const body = req.body;
    const modificaciones = {
      $set: {
        nombres: body.nombres,
        apellidos: body.apellidos,
        direccion: {
          calle: body.direccion?.calle,
          numero: body.direccion?.numero,
          departamento: body.direccion?.departamento ?? null,
          ciudad: body.direccion?.ciudad,
        },
        fecha_registro: new Date(body.fecha_registro),
      },
    };
    const resultado = await collection.updateOne(consulta, modificaciones);
    res.status(200).send(resultado);
  } catch (err) {
    console.error("ERROR EN PATCH: ", err);
    res.status(500).send("Error al modificar un cliente!");
  }
});

////////////////////////////////////

// UPDATE/DELETE: cambio de estado
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
    res.status(500).send("Error al cambiar el estado del cliente!");
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
