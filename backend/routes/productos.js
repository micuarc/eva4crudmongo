const express = require("express");
const { getDB, connectDB } = require("../db");
const router = express.Router();
const db = getDB();
const collection = db.collection("Productos");

//CREATE:
router.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (!body.nombre || !body.precio || !body.stock) {
      return res.status(400).json({
        error: "Campos requeridos: nombre, precio, stock",
        recibido: body,
      });
    }

    const id_max_actual = await collection
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    const nuevo_id = id_max_actual.length > 0 ? id_max_actual[0]._id + 1 : 1;
    const doc = {
      _id: nuevo_id,
      nombre: body.nombre,
      precio: parseInt(body.precio),
      stock: parseInt(body.stock),
      estado: body.estado,
    };
    if (body.fecha_vencimiento) {
      doc.fecha_vencimiento = new Date(body.fecha_vencimiento);
    }

    const result = await collection.insertOne(doc);
    res.status(201).send(result);
  } catch (err) {
    console.error("ERROR: ", JSON.stringify(err));
    res.status(500).send("ERROR AL CREAR PRODUCTO.");
  }
});

// READ: todos los productos
router.get("/", async (req, res) => {
  try {
    const resultados = await collection.find({}).toArray();
    res.status(200).send(resultados);
  } catch (err) {
    console.error("ERROR: ", JSON.stringify(err));
    res.status(500).send("Error al obtener productos");
  }
});

//READ: por ID de producto
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const consulta = { _id: id };
    const resultado = await collection.findOne(consulta);
    if (!resultado)
      res.status(404).send("No se encontro un producto con ese id!");
    else res.status(200).send(resultado);
  } catch (err) {
    console.error("ERROR: ", JSON.stringify(err));
    res.status(400).send("Id invalido!");
  }
});

router.get("/estado/:estado", async (req, res) => {
  try {
    const { estado } = req.params;
    const resultados = await collection.find({ estado }).toArray();
    res.status(200).send(resultados);
  } catch (err) {
    console.error("ERROR al filtrar por estado:", err);
    res.status(500).send("Error al filtrar productos por estado");
  }
});

// UPDATE
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const consulta = { _id: id };
    const body = req.body;

    if (!body.nombre || !body.precio || !body.stock) {
      return res.status(400).json({
        error: "Se necesita al menos: nombre, precio, stock",
      });
    }

    const modificaciones = {
      $set: {
        nombre: body.nombre,
        precio: parseInt(body.precio),
        stock: parseInt(body.stock),
        fecha_vencimiento: new Date(body.fecha_vencimiento),
        estado: body.estado || "activo",
      },
    };
    const resultado = await collection.updateOne(consulta, modificaciones);
    if (resultado.matchedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.status(200).send(resultado);
  } catch (err) {
    console.error("ERROR EN PATCH: ", err);
    res.status(500).send("Error al modificar un producto!");
  }
});

// UPDATE/DELETE: cambiar estado
router.patch("/cambiar_estado/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
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
    console.error("ERROR: ", JSON.stringify(err));
    res.status(500).send("Error al eliminar un cliente!");
  }
});

//VERIFICAR STOCK

router.post("/verificar-stock", async (req, res) => {
  try {
    const { id_producto, cantidad } = req.body;
    const producto = await collection.findOne({ _id: parseInt(id_producto) });

    if (!producto) {
      return res.status(404).json({ error: "No se enocntro el producto" });
    }

    res.json({
      stock_suficiente: producto.stock >= parseInt(cantidad),
      stock_actual: producto.stock,
      nombre_producto: producto.nombre,
    });
  } catch (error) {
    console.error("Error verificando stock:", error);
    res.status(500).json({ error: "Error al verificar stock" });
  }
});

module.exports = router;
