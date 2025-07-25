const express = require("express");
const { getDB, connectDB } = require("../db");
const router = express.Router();
const db = getDB();
const collection = db.collection("Pedidos");

//FUNCIONES AUXILIARES PARA MANEJO DE STOCK DE PRODUCTOS

async function verificarStock(db, productos) {
  //tomar el id de los productos del pedido
  const id_productos = productos.map((producto) => producto.id_producto);
  //buscar los productos en la bd de productos mapeando con el id
  const bd_productos = await db
    .collection("Productos")
    .find({ _id: { $in: id_productos } })
    .toArray();

  // por cada producto del pedido
  const productosDelPedido = productos.map((producto) => {
    //tomamos un producto
    const producto_seleccionado = bd_productos.find((producto_buscado) =>
      producto_buscado._id.equals(producto.id_producto)
    );
    //vemos la cantidad de productos que el pedido necesita
    const cantidad_requerida = producto.cantidad;
    //tomamos el stock del producto en caso de existir
    const stock_actual = producto_seleccionado
      ? producto_seleccionado.stock
      : 0;
    // devolvemos los datos del producto,
    const informacion_stock = {
      id_producto: producto.id_producto,
      stock_actual,
      stock_necesario: stock_actual >= cantidad_requerida,
    };
    return informacion_stock;
  });
  return productosDelPedido;
}

// funciión para actualizar el stock de productos
async function actualizarStockProductos(db, productos, accion) {
  for (const producto of productos) {
    const cantidad = producto.cantidad;
    const cambio = accion === "agregar" ? cantidad : -cantidad;

    await db
      .collection("Productos")
      .updateOne({ _id: producto.id_producto }, { $inc: { stock: cambio } });
  }
}

// CREATE
router.post("/", async (req, res) => {
  try {
    const { productos, ...body } = req.body;

    //verificar stock de los productos
    const enStock = await verificarStock(db, productos);
    const sinStock = enStock.filter((p) => !p.stock_necesario);

    if (sinStock.length > 0) {
      return res.status(400).json({
        error: "Stock insuficiente de lo(s) pedido(s): ",
        productos: sinStock.map((p) => ({
          id_producto: p.id_producto,
          stock_disponible: p.stock_disponible,
          cantidad_solicitada: p.cantidad,
        })),
      });
    }

    const doc = {
      ...body,
      _id: body._id,
      id_cliente: body.id_cliente,
      fecha_pedido: new Date(body.fecha_pedido || Date.now()),
      productos: productos.map((producto) => ({
        id_producto: producto.id_producto,
        cantidad: parseInt(producto.cantidad),
        precio_unitario: parseInt(producto.precio_unitario),
        total_producto: parseInt(producto.total_producto),
      })),
      total_pedido: parseInt(body.total_pedido),
      metodo_pago: body.metodo_pago,
      estado: "solicitado",
      metodo_pago: body.metodo_pago,
    };
    const resultado = await collection.insertOne(doc);
    res.status(201).send(resultado);
  } catch (err) {
    console.error("ERROR: ", err);
    res.status(500).send("Error al crear un pedido!");
  }
});

////////////////////////////////////

// READ: todos los archivos
router.get("/", async (req, res) => {
  try {
    const resultados = await collection.find({}).toArray();
    res.status(200).send(resultados);
  } catch (err) {
    console.error("ERROR: ", err);
    res.status(400).send("Error al mostrar los pedidos!");
  }
});

// READ: por ID de producto
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const consulta = { _id: id };
    const resultado = await collection.findOne(consulta);
    if (!resultado)
      res.status(404).send("No se encontro un pedido con ese id!");
    else res.status(200).send(resultado);
  } catch (err) {
    res.status(400).send("Id invalido!");
  }
});

// READ: por estado de producto
router.get("/:estado", async (req, res) => {
  try {
    const estado = req.params.estado;
    const consulta = { estado: estado };
    const resultado = await collection.findOne(consulta);
    if (!resultado)
      res.status(404).send("No se encontraron pedidos con ese estado!");
    else res.status(200).send(resultado);
  } catch (err) {
    res.status(400).send("Estado invalido!");
  }
});

//LECTURAS DE PEDIDOS POR FECHA:

// READ: por dia/mes/anio del pedido
router.get("/filtro_fecha/por_diaMesAnio/:dia/:mes/:anio", async (req, res) => {
  const { dia, mes, anio } = req.params;
  try {
    const resultados = await db
      .collection("Pedidos")
      .aggregate([
        {
          $addFields: {
            dia: { $dayOfMonth: "$fecha_pedido" },
            mes: { $month: "$fecha_pedido" },
            anio: { $year: "$fecha_pedido" },
          },
        },
        {
          $match: {
            dia: parseInt(dia),
            mes: parseInt(mes),
            anio: parseInt(anio),
          },
        },
        {
          $project: { dia: 0, mes: 0, anio: 0 },
        },
      ])
      .toArray();
    res.status(200).send(resultados);
  } catch (err) {
    res.status(500).send("Error al filtrar pedidos por dia!");
  }
});

//READ: FILTRAR POR MES Y AÑO
router.get("/filtro_fecha/por_mesAnio/:mes/:anio", async (req, res) => {
  const { mes, anio } = req.params;
  try {
    const resultados = await db
      .collection("Pedidos")
      .aggregate([
        {
          $addFields: {
            mes: { $month: "$fecha_pedido" },
            anio: { $year: "$fecha_pedido" },
          },
        },
        {
          $match: {
            mes: parseInt(mes),
            anio: parseInt(anio),
          },
        },
        {
          $project: { mes: 0, anio: 0 },
        },
      ])
      .toArray();
    res.status(200).send(resultados);
  } catch (err) {
    res.status(500).send("Error al filtrar pedidos por mes y anio!");
  }
});

//READ: FILTRAR POR MES (INDEPENDIENTE DEL AÑO)
router.get("/filtro_fecha/por_mes/:mes", async (req, res) => {
  const { mes } = req.params;
  try {
    const resultados = await db
      .collection("Pedidos")
      .aggregate([
        {
          $addFields: {
            mes: { $month: "$fecha_pedido" },
          },
        },
        {
          $match: {
            mes: parseInt(mes),
          },
        },
        {
          $project: { mes: 0 },
        },
      ])
      .toArray();
    res.status(200).send(resultados);
  } catch (err) {
    res.status(500).send("Error al filtrar pedidos por mes!");
  }
});

//READ: FILTRAR POR AÑO
router.get("/filtro_fecha/por_anio/:anio", async (req, res) => {
  const { anio } = req.params;
  try {
    const resultados = await db
      .collection("Pedidos")
      .aggregate([
        {
          $addFields: {
            anio: { $year: "$fecha_pedido" },
          },
        },
        {
          $match: {
            anio: parseInt(anio),
          },
        },
        {
          $project: { anio: 0 },
        },
      ])
      .toArray();
    res.status(200).send(resultados);
  } catch (err) {
    res.status(500).send("Error al filtrar pedidos por año!");
  }
});

////////////////////////////////////

// UPDATE/DELETE: cambio de estado
router.patch("/cambiar_estado/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pedido = await collection.findOne({ _id: id });
    if (!pedido)
      return res.status(404).send("No se ha encontrado el pedido con ese ID");

    // si se pide cancelar el pedido, se devolvera el stock solo si
    // anteriormente el pedido estaba recien solicitado o en preparación

    if (
      estado === "cancelado" &&
      (pedido.estado === "en preparación" || pedido.estado === "solicitado")
    ) {
      for (const producto of pedido.productos) {
        await db
          .collection("Productos")
          .updateOne(
            { _id: producto.id_producto },
            { $inc: { stock: producto.cantidad } }
          );
      }
    }
    // actualizamos el estado del pedido
    await collection.updateOne({ _id: id }, { $set: { estado } });
    res.status(200).send("Estado actualizado correctamente");
  } catch (err) {
    console.error("Error al cambiar estado:", err);
    res.status(500).send("Error al actualizar el estado del pedido");
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
    res
      .status(500)
      .send("Error al eliminar un pedido! Confirme que el ID es el correcto");
  }
});

module.exports = router;
