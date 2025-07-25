mongosh = db;
mongosh = mongosh.getSiblingDB("admin");
mongosh.createUser({
  user: "admin",
  pwd: "contrasenia",
  roles: [{ role: "root", db: "admin" }],
});

const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;

mongosh = mongosh.getSiblingDB(DB_NAME);
mongosh.createUser({
  user: DB_USER,
  pwd: DB_PASSWORD,
  roles: [{ role: "readWrite", db: DB_NAME }],
});

mongosh.createCollection("Clientes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "_id",
        "nombres",
        "apellidos",
        "direccion",
        "fecha_registro",
        "estado",
      ],
      properties: {
        _id: { bsonType: "int" },
        nombres: { bsonType: "string" },
        apellidos: { bsonType: "string" },
        direccion: {
          bsonType: "object",
          required: ["calle", "numero", "ciudad"],
          properties: {
            calle: { bsonType: "string" },
            numero: { bsonType: "string" },
            ciudad: { bsonType: "string" },
          },
        },
        fecha_registro: { bsonType: "date" },
        estado: {
          enum: ["nuevo", "activo", "inactivo"],
        },
      },
    },
  },
});

db.getCollection("Productos").drop();
db.getCollection("Pedidos").drop();
// // coleccion productos
// mongosh.createCollection("Productos", {
//   validator: {
//     $jsonSchema: {
//       bsonType: "object",
//       required: [
//         "_id",
//         "nombre",
//         "precio",
//         "stock",
//         "fecha_vencimiento",
//         "estado",
//       ],
//       properties: {
//         _id: { bsonType: "int" },
//         nombre: { bsonType: "string" },
//         precio: { bsonType: "int" },
//         stock: { bsonType: "int" },
//         fecha_vencimiento: { bsonType: "date" },
//         estado: {
//           enum: ["disponible", "agotado", "descontinuado"],
//         },
//       },
//     },
//   },
// });

// // coleccion pedidos
// mongosh.createCollection("Pedidos", {
//   validator: {
//     $jsonSchema: {
//       bsonType: "object",
//       required: [
//         "_id",
//         "id_cliente",
//         "fecha_pedido",
//         "productos",
//         "total_pedido",
//         "metodo_pago",
//         "estado",
//       ],
//       properties: {
//         _id: { bsonType: "int" },
//         id_cliente: { bsonType: "int" },
//         fecha_pedido: { bsonType: "date" },
//         productos: {
//           bsonType: "array",
//           items: {
//             bsonType: "object",
//             required: [
//               "id_producto",
//               "cantidad",
//               "precio_unitario",
//               "total_producto",
//             ],
//             properties: {
//               id_producto: { bsonType: "int" },
//               cantidad: { bsonType: "int" },
//               precio_unitario: { bsonType: "int" },
//               total_producto: { bsonType: "int" },
//             },
//           },
//         },
//         total_pedido: { bsonType: "int" },
//         metodo_pago: { enum: ["transferencia", "efectivo", "tarjeta"] },
//         estado: {
//           enum: [
//             "solicitado",
//             "en preparación",
//             "enviado",
//             "entregado",
//             "cancelado",
//           ],
//         },
//       },
//     },
//   },
// });
