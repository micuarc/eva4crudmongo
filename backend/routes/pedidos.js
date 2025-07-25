const express = require("express");
const { getDB, connectDB } = require("../db");
const router = express.Router();
const db = getDB();
const collection = db.collection("Pedidos");

// FUNCIONES AUXILIARES PARA MANEJO DE STOCK DE PRODUCTOS
async function verificarStock(db, productos) {
  try {
    const id_productos = productos.map((p) => parseInt(p.id_producto));
    const bd_productos = await db
      .collection("Productos")
      .find({ _id: { $in: id_productos } })
      .toArray();

    return productos.map((producto) => {
      const productoId = parseInt(producto.id_producto);
      const productoBD = bd_productos.find((p) => p._id === productoId);
      const stockDisponible = productoBD ? productoBD.stock : 0;

      return {
        id_producto: productoId,
        nombre: productoBD?.nombre || "Producto desconocido",
        stock_actual: stockDisponible,
        stock_necesario: stockDisponible >= parseInt(producto.cantidad),
        cantidad_solicitada: parseInt(producto.cantidad),
      };
    });
  } catch (error) {
    console.error("Error en verificación de stock:", error);
    throw error;
  }
}

async function actualizarStockProductos(db, productos, accion) {
  try {
    for (const producto of productos) {
      const cantidad = parseInt(producto.cantidad);
      const cambio = accion === "agregar" ? cantidad : -cantidad;

      await db
        .collection("Productos")
        .updateOne(
          { _id: parseInt(producto.id_producto) },
          { $inc: { stock: cambio } }
        );
    }
  } catch (error) {
    console.error("Error en funcion actualizarStockProductos:", error);
    throw error;
  }
}

// CREATE -crear nuevo pedido
router.post("/", async (req, res) => {
  try {
    console.log("body recibido:", req.body);

    // validar el id del cliente
    if (!req.body.id_cliente) {
      return res.status(400).json({
        message: "el id del cliente es necesario",
        received: req.body,
      });
    }

    const { productos, ...body } = req.body;

    // verificar  stock del producto x añadir
    const enStock = await verificarStock(db, productos);
    const sinStock = enStock.filter((p) => !p.stock_necesario);

    if (sinStock.length > 0) {
      return res.status(400).json({
        error: "stock insuficiente",
        productos: sinStock.map((p) => ({
          id: p.id_producto,
          nombre: p.nombre,
          stock: p.stock_actual,
          requerido: p.cantidad_solicitada,
        })),
      });
    }

    const id_max_actual = await collection
      .find()
      .sort({ _id: -1 })
      .limit(1)
      .toArray();
    const nuevo_id = id_max_actual.length > 0 ? id_max_actual[0]._id + 1 : 1;

    // Creación del documento
    const doc = {
      ...body,
      _id: nuevo_id,
      id_cliente: parseInt(body.id_cliente),
      fecha_pedido: new Date(body.fecha_pedido || Date.now()),
      productos: productos.map((producto) => ({
        id_producto: parseInt(producto.id_producto),
        cantidad: parseInt(producto.cantidad),
        precio_unitario: parseFloat(producto.precio_unitario),
        total_producto: parseFloat(producto.total_producto),
      })),
      total_pedido: parseFloat(body.total_pedido),
      metodo_pago: body.metodo_pago,
      estado: "solicitado",
    };

    const resultado = await collection.insertOne(doc);

    // Actualizar stock
    await actualizarStockProductos(db, productos, "restar");

    res.status(201).json({
      success: true,
      orderId: nuevo_id,
      productos: enStock.map((p) => ({
        id: p.id_producto,
        nombre: p.nombre,
        nuevo_stock: p.stock_actual - p.cantidad_solicitada,
      })),
    });
  } catch (err) {
    res.status(500).json({
      error: "error al crear pedido",
      message: err.message,
    });
  }
});

// READ - Obtener todos los pedidos
router.get("/", async (req, res) => {
  try {
    const resultados = await collection.find({}).toArray();
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// READ - Obtener pedido por ID numérico
router.get("/id/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID debe ser numérico" });
    }

    const resultado = await collection.findOne({ _id: id });
    if (!resultado) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }
    res.status(200).json(resultado);
  } catch (err) {
    console.error("Error fetching order by ID:", err);
    res.status(500).json({ error: "Error al buscar pedido" });
  }
});

// READ - Obtener pedidos por estado
router.get("/estado/:estado", async (req, res) => {
  try {
    const estado = req.params.estado;
    const estadosValidos = [
      "solicitado",
      "en preparación",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        error: "Estado inválido",
        estados_validos: estadosValidos,
      });
    }

    const resultados = await collection.find({ estado }).toArray();
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error fetching orders by status:", err);
    res.status(500).json({ error: "Error al buscar pedidos por estado" });
  }
});

// READ - Obtener pedidos por cliente
router.get("/cliente/:idCliente", async (req, res) => {
  try {
    const idCliente = parseInt(req.params.idCliente);
    if (isNaN(idCliente)) {
      return res.status(400).json({ error: "ID de cliente debe ser numérico" });
    }

    const resultados = await collection
      .find({ id_cliente: idCliente })
      .toArray();
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error fetching orders by client:", err);
    res.status(500).json({ error: "Error al buscar pedidos por cliente" });
  }
});

// FILTROS POR FECHA
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
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error filtering by date:", err);
    res.status(500).json({ error: "Error al filtrar pedidos por fecha" });
  }
});

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
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error filtering by month/year:", err);
    res.status(500).json({ error: "Error al filtrar pedidos por mes/año" });
  }
});

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
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error filtering by month:", err);
    res.status(500).json({ error: "Error al filtrar pedidos por mes" });
  }
});

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
    res.status(200).json(resultados);
  } catch (err) {
    console.error("Error filtering by year:", err);
    res.status(500).json({ error: "Error al filtrar pedidos por año" });
  }
});

// Detalles x id
router.get("/detalle/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pedido = await collection.findOne({ _id: id });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Get product details
    const idsProductos = pedido.productos.map((p) => p.id_producto);
    const productos = await db
      .collection("Productos")
      .find({ _id: { $in: idsProductos } })
      .toArray();

    res.status(200).json({
      ...pedido,
      productos: pedido.productos.map((item) => {
        const producto = productos.find((p) => p._id === item.id_producto);
        return {
          ...item,
          nombre: producto?.nombre || "Desconocido",
          precio_unitario: producto?.precio || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Error obteniendo detalle:", error);
    res.status(500).json({ error: "Error al obtener detalle del pedido" });
  }
});

// Tomaro den para editar
router.get("/editar/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pedido = await collection.findOne({ _id: id });

    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    res.status(200).json(pedido);
  } catch (error) {
    console.error("Error obteniendo pedido para edición:", error);
    res.status(500).json({ error: "Error al obtener pedido" });
  }
});

// UPDATE - Cambiar estado de pedido
router.patch("/cambiar_estado/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pedido = await collection.findOne({ _id: Number(id) });
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (
      estado === "cancelado" &&
      (pedido.estado === "en preparación" || pedido.estado === "solicitado")
    ) {
      await actualizarStockProductos(db, pedido.productos, "agregar");
    }

    await collection.updateOne({ _id: Number(id) }, { $set: { estado } });
    res.status(200).json({ success: true, message: "Estado actualizado" });
  } catch (err) {
    console.error("Error updating status:", err);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

// UPDATE - Editar pedido completo
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID debe ser numérico" });
    }

    // Validar datos básicos del pedido
    if (
      !req.body.id_cliente ||
      !req.body.productos ||
      !Array.isArray(req.body.productos)
    ) {
      return res.status(400).json({
        error: "Datos incompletos",
        detalles: "Se requieren id_cliente y array de productos",
      });
    }

    // Obtener el pedido actual para comparar
    const pedidoActual = await collection.findOne({ _id: id });
    if (!pedidoActual) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Verificar stock para los nuevos productos
    const enStock = await verificarStock(db, req.body.productos);
    const sinStock = enStock.filter((p) => !p.stock_necesario);

    if (sinStock.length > 0) {
      return res.status(400).json({
        error: "Stock insuficiente",
        productos: sinStock.map((p) => ({
          id: p.id_producto,
          nombre: p.nombre,
          stock: p.stock_actual,
          requerido: p.cantidad_solicitada,
        })),
      });
    }

    // Preparar datos para actualización
    const datosActualizados = {
      id_cliente: parseInt(req.body.id_cliente),
      fecha_pedido: new Date(req.body.fecha_pedido || Date.now()),
      productos: req.body.productos.map((p) => ({
        id_producto: parseInt(p.id_producto),
        cantidad: parseInt(p.cantidad),
        precio_unitario: parseFloat(p.precio_unitario),
        total_producto: parseFloat(p.total_producto),
      })),
      total_pedido: parseFloat(req.body.total_pedido),
      metodo_pago: req.body.metodo_pago,
      estado: req.body.estado || pedidoActual.estado,
    };

    // Manejo de cambios en el stock
    const productosEliminados = pedidoActual.productos.filter(
      (pActual) =>
        !req.body.productos.some(
          (pNuevo) => pNuevo.id_producto === pActual.id_producto
        )
    );

    const productosNuevos = req.body.productos.filter(
      (pNuevo) =>
        !pedidoActual.productos.some(
          (pActual) => pActual.id_producto === pNuevo.id_producto
        )
    );

    const productosModificados = req.body.productos
      .filter((pNuevo) =>
        pedidoActual.productos.some(
          (pActual) => pActual.id_producto === pNuevo.id_producto
        )
      )
      .map((pNuevo) => {
        const pActual = pedidoActual.productos.find(
          (p) => p.id_producto === pNuevo.id_producto
        );
        return {
          id_producto: pNuevo.id_producto,
          diferencia: parseInt(pNuevo.cantidad) - parseInt(pActual.cantidad),
        };
      });

    // Actualizar stock
    await actualizarStockProductos(db, productosEliminados, "agregar"); // Restaurar stock de productos eliminados
    await actualizarStockProductos(db, productosNuevos, "restar"); // Reducir stock de productos nuevos
    await Promise.all(
      productosModificados.map(async (p) => {
        if (p.diferencia !== 0) {
          await db
            .collection("Productos")
            .updateOne(
              { _id: p.id_producto },
              { $inc: { stock: -p.diferencia } }
            );
        }
      })
    );

    // Actualizar el pedido en la base de datos
    const resultado = await collection.updateOne(
      { _id: id },
      { $set: datosActualizados }
    );

    if (resultado.modifiedCount === 0) {
      return res.status(400).json({
        warning: "No se realizaron cambios",
        pedido_actual: pedidoActual,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pedido actualizado correctamente",
      cambios_stock: {
        productos_eliminados: productosEliminados.map((p) => p.id_producto),
        productos_nuevos: productosNuevos.map((p) => p.id_producto),
        productos_modificados: productosModificados
          .filter((p) => p.diferencia !== 0)
          .map((p) => ({
            id_producto: p.id_producto,
            diferencia: p.diferencia,
          })),
      },
    });
  } catch (err) {
    console.error("Error al editar pedido:", err);
    res.status(500).json({
      error: "Error al editar pedido",
      message: err.message,
    });
  }
});

// DELETE - Eliminar pedido
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pedido = await collection.findOne({ _id: id });
    if (!pedido) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    //restaurar stock de los producots del pedido pro eliminar
    const resultadosStock = [];
    for (const producto of pedido.productos || []) {
      const productoId = producto.id_producto;
      const cantidad = producto.cantidad;

      const result = await db
        .collection("Productos")
        .updateOne({ _id: productoId }, { $inc: { stock: cantidad } });

      resultadosStock.push({
        producto_id: productoId,
        cantidad,
        actualizado: result.modifiedCount > 0,
      });
    }

    // verificar modificaciones de productos exitosas
    const fallos = resultadosStock.filter((r) => !r.actualizado);
    if (fallos.length > 0) {
      return res.status(500).json({
        error: "Error al restaurar stock para algunos productos",
        productos_con_error: fallos,
      });
    }
    //eliminar pedido
    const resultado = await collection.deleteOne({ _id: id });
    if (resultado.deletedCount === 0) {
      return res.status(404).json({ error: "No se pudo eliminar el pedido" });
    }

    res.status(200).json({
      success: true,
      deletedCount: resultado.deletedCount,
      stockRestaurado: pedido.productos.map((p) => ({
        id_producto: p.id_producto,
        cantidad: p.cantidad,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "error al eliminar pedido" });
  }
});

module.exports = router;
