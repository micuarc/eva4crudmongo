import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [showModal, setShowModal] = useState({
    nuevo: false,
    editar: false,
    eliminar: false,
    detalle: false,
  });
  const [pedidoActual, setPedidoActual] = useState({
    id_cliente: "",
    fecha_pedido: new Date().toISOString().split("T")[0],
    productos: [],
    total_pedido: 0,
    metodo_pago: "efectivo",
    estado: "solicitado",
  });
  const [nuevoProducto, setNuevoProducto] = useState({
    id_producto: "",
    cantidad: 1,
    precio_unitario: 0,
    total_producto: 0,
  });
  const [filtros, setFiltros] = useState({
    estado: "",
    dia: "",
    mes: "",
    anio: "",
    idCliente: "",
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [pedidosRes, clientesRes, productosRes] = await Promise.all([
        fetch("/api/joinQueries/segun-cliente"),
        fetch("/api/clientes"),
        fetch("/api/productos"),
      ]);

      const [pedidosData, clientesData, productosData] = await Promise.all([
        pedidosRes.json(),
        clientesRes.json(),
        productosRes.json(),
      ]);

      setPedidos(pedidosData);
      setClientes(clientesData);
      setProductosDisponibles(productosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPedidoActual((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
  };

  const filtrarPorEstado = async () => {
    try {
      const url = filtros.estado
        ? `/api/pedidos/estado/${filtros.estado}`
        : "/api/pedidos";

      const res = await fetch(url);
      const data = await res.json();

      const pedidosConClientes = data.map((pedido) => {
        const cliente = clientes.find((c) => c._id === pedido.id_cliente);
        return {
          ...pedido,
          cliente: cliente || null,
        };
      });

      setPedidos(
        Array.isArray(pedidosConClientes)
          ? pedidosConClientes
          : [pedidosConClientes]
      );
    } catch (error) {
      console.error("Error filtrando por estado:", error);
      alert("Error al filtrar por estado");
    }
  };

  const filtrarPorCliente = async () => {
    try {
      if (!filtros.idCliente) {
        cargarDatosIniciales();
        return;
      }

      const res = await fetch(`/api/pedidos/cliente/${filtros.idCliente}`);
      const data = await res.json();
      setPedidos(data);
    } catch (error) {
      console.error("Error filtrando por cliente:", error);
      alert("Error al filtrar por cliente");
    }
  };

  const filtrarPorFecha = async () => {
    try {
      let url = "/api/pedidos/filtro_fecha";

      if (filtros.dia && filtros.mes && filtros.anio) {
        url += `/por_diaMesAnio/${filtros.dia}/${filtros.mes}/${filtros.anio}`;
      } else if (filtros.mes && filtros.anio) {
        url += `/por_mesAnio/${filtros.mes}/${filtros.anio}`;
      } else if (filtros.mes) {
        url += `/por_mes/${filtros.mes}`;
      } else if (filtros.anio) {
        url += `/por_anio/${filtros.anio}`;
      } else {
        return cargarDatosIniciales();
      }

      const res = await fetch(url);
      const data = await res.json();

      // Mapear los pedidos para incluir la información completa del cliente
      const pedidosConClientes = data.map((pedido) => {
        const cliente = clientes.find((c) => c._id === pedido.id_cliente);
        return {
          ...pedido,
          cliente: cliente || null,
        };
      });

      setPedidos(pedidosConClientes);
    } catch (error) {
      console.error("Error filtrando por fecha:", error);
      alert("Error al filtrar por fecha");
    }
  };

  const abrirModalNuevo = () => {
    setPedidoActual({
      id_cliente: "",
      fecha_pedido: new Date().toISOString().split("T")[0],
      productos: [],
      total_pedido: 0,
      metodo_pago: "efectivo",
      estado: "solicitado",
    });
    setShowModal({ ...showModal, nuevo: true });
  };

  const verDetallePedido = async (id) => {
    try {
      const res = await fetch(`/api/pedidos/detalle/${id}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const pedido = await res.json();
      const cliente = clientes.find((c) => c._id === pedido.id_cliente);

      setPedidoActual({
        ...pedido,
        cliente: cliente,
        fecha_pedido: pedido.fecha_pedido.split("T")[0],
      });
      setShowModal({ ...showModal, detalle: true });
    } catch (error) {
      console.error("Error cargando detalle:", error);
    }
  };

  const agregarProducto = async () => {
    try {
      // validaciones básicas
      if (!nuevoProducto.id_producto || nuevoProducto.cantidad <= 0) {
        alert("Seleccione un producto y cantidad válida");
        return;
      }

      const idBuscado = parseInt(nuevoProducto.id_producto);
      const cantidad = parseInt(nuevoProducto.cantidad);

      // buscar el producto
      const productoSeleccionado = productosDisponibles.find(
        (p) => p._id === idBuscado
      );

      if (!productoSeleccionado) {
        alert(`Error: Producto con ID ${idBuscado} no encontrado`);
        return;
      }

      // verificamos el stock del producto
      const response = await fetch("/api/productos/verificar-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_producto: idBuscado,
          cantidad: cantidad,
        }),
      });

      const stockInfo = await response.json();

      if (!response.ok || !stockInfo.stock_suficiente) {
        alert(
          `No hay suficiente stock de: ${stockInfo.nombre_producto}\nStock disponible: ${stockInfo.stock_actual}\nCantidad solicitada: ${cantidad}`
        );
        return;
      }

      // si pasa todas las validaciones, agregamso el producto
      const nuevoProductoPedido = {
        id_producto: idBuscado,
        cantidad: cantidad,
        precio_unitario: productoSeleccionado.precio,
        total_producto: productoSeleccionado.precio * cantidad,
        nombre: productoSeleccionado.nombre,
      };

      setPedidoActual((prev) => ({
        ...prev,
        productos: [...prev.productos, nuevoProductoPedido],
        total_pedido: prev.total_pedido + nuevoProductoPedido.total_producto,
      }));

      // resetear el form
      setNuevoProducto({
        id_producto: "",
        cantidad: 1,
        precio_unitario: 0,
        total_producto: 0,
      });
    } catch (errr) {
      console.error("Error al agregar producto:", error);
      alert("Ocurrió un error al agregar el producto");
    }
  };

  const eliminarProducto = (index) => {
    setPedidoActual((prev) => {
      const nuevosProductos = [...prev.productos];
      const productoEliminado = nuevosProductos.splice(index, 1)[0];

      return {
        ...prev,
        productos: nuevosProductos,
        total_pedido:
          prev.total_pedido - (productoEliminado.total_producto || 0),
      };
    });
  };

  const guardarPedido = async () => {
    try {
      if (!pedidoActual.id_cliente || pedidoActual.productos.length === 0) {
        alert("Debe seleccionar un cliente y agregar productos");
        return;
      }

      let pedidoOriginal = {};
      if (pedidoActual._id) {
        const res = await fetch(`/api/pedidos/id/${pedidoActual._id}`);
        pedidoOriginal = await res.json();
      }

      const datosParaEnviar = {
        id_cliente: parseInt(pedidoActual.id_cliente),
        fecha_pedido: pedidoActual.fecha_pedido,
        productos: pedidoActual.productos.map((p) => ({
          id_producto: parseInt(p.id_producto),
          cantidad: parseInt(p.cantidad),
          precio_unitario: parseFloat(p.precio_unitario),
          total_producto: parseFloat(p.total_producto),
        })),
        total_pedido: pedidoActual.productos.reduce(
          (sum, p) => sum + parseFloat(p.total_producto || 0),
          0
        ),
        metodo_pago: pedidoActual.metodo_pago,
        estado: pedidoActual.estado,
      };

      const esEdicion = !!pedidoActual._id;
      if (esEdicion) {
        datosParaEnviar._id = parseInt(pedidoActual._id);

        const hayCambios =
          JSON.stringify(datosParaEnviar) !==
          JSON.stringify({
            ...pedidoOriginal,
            _id: parseInt(pedidoOriginal._id),
          });

        if (!hayCambios) {
          setShowModal({ ...showModal, editar: false });
          return;
        }
      }

      const url = esEdicion
        ? `/api/pedidos/${pedidoActual._id}`
        : "/api/pedidos";

      const method = esEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaEnviar),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      setShowModal({ ...showModal, nuevo: false, editar: false });
      cargarDatosIniciales();
      alert(
        esEdicion
          ? "Pedido actualizado correctamente!"
          : "Pedido creado correctamente!"
      );
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const cargarPedidoParaEditar = async (id) => {
    try {
      const idNumerico = typeof id === "number" ? id : parseInt(id);
      if (isNaN(idNumerico)) {
        throw new Error("El ID del pedido debe ser numérico");
      }
      const res = await fetch(`/api/pedidos/id/${idNumerico}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al cargar el pedido");
      }

      const pedido = await res.json();
      if (!pedido || !pedido._id) {
        throw new Error("El pedido no tiene la estructura esperada");
      }
      const productosFormateados = Array.isArray(pedido.productos)
        ? pedido.productos.map((p) => ({
            ...p,
            id_producto: p.id_producto?.toString() || "",
            cantidad: p.cantidad || 1,
            precio_unitario: p.precio_unitario || 0,
            total_producto: p.total_producto || 0,
          }))
        : [];

      setPedidoActual({
        ...pedido,
        id_cliente: pedido.id_cliente?.toString() || "",
        productos: productosFormateados,
        fecha_pedido:
          pedido.fecha_pedido?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
      });

      setShowModal({ ...showModal, editar: true });
    } catch (error) {
      console.error("Error cargando pedido:", error);
      alert(`Error al cargar pedido para edición: ${error.message}`);
    }
  };

  const confirmarEliminarPedido = async () => {
    try {
      const res = await fetch(`/api/pedidos/${pedidoActual._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowModal({ ...showModal, eliminar: false });
        cargarDatosIniciales();
      }
    } catch (error) {
      console.error("Error eliminando pedido:", error);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-5 mt-3">Panel de Pedidos</h1>
      <div className="d-flex justify-content-center">
        {/* Filtros */}
        <div className="d-flex flex-column gap-3 mb-4">
          <div className="d-flex flex-wrap gap-3 align-items-end">
            {/* Filtro por Estado */}
            <div>
              <Form.Label>Filtrar por Estado</Form.Label>
              <div className="d-flex gap-2">
                <Form.Select
                  name="estado"
                  value={filtros.estado}
                  onChange={handleFiltroChange}
                  style={{ width: "200px" }}
                >
                  <option value="">Todos los estados</option>
                  <option value="solicitado">Solicitado</option>
                  <option value="en preparación">En preparación</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </Form.Select>
                <Button onClick={filtrarPorEstado}>Filtrar</Button>
              </div>
            </div>

            {/* Filtro por Fecha */}
            <div>
              <Form.Label>Filtrar por fecha</Form.Label>
              <div className="d-flex flex-wrap gap-2">
                <Form.Control
                  type="number"
                  name="dia"
                  value={filtros.dia}
                  onChange={handleFiltroChange}
                  placeholder="Día"
                  min="1"
                  max="31"
                  style={{ width: "80px" }}
                />
                <Form.Control
                  type="number"
                  name="mes"
                  value={filtros.mes}
                  onChange={handleFiltroChange}
                  placeholder="Mes"
                  min="1"
                  max="12"
                  style={{ width: "80px" }}
                />
                <Form.Control
                  type="number"
                  name="anio"
                  value={filtros.anio}
                  onChange={handleFiltroChange}
                  placeholder="Año"
                  min="2000"
                  style={{ width: "100px" }}
                />
                <Button onClick={filtrarPorFecha}>Filtrar</Button>
              </div>
            </div>

            {/* Filtro por Cliente */}
            <div>
              <Form.Label>Filtrar por ID Cliente</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="number"
                  name="idCliente"
                  value={filtros.idCliente}
                  onChange={handleFiltroChange}
                  placeholder="ID del cliente"
                  style={{ width: "150px" }}
                />
                <Button onClick={filtrarPorCliente}>Filtrar</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-around mb-4">
        {" "}
        <Button
          variant="outline-danger"
          onClick={() => {
            setFiltros({
              estado: "",
              dia: "",
              mes: "",
              anio: "",
              idCliente: "",
            });
            cargarDatosIniciales();
          }}
        >
          Limpiar filtros
        </Button>
        <Button variant="success" onClick={abrirModalNuevo}>
          Nuevo Pedido
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead className="table-primary">
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <tr key={pedido._id}>
              <td>{pedido._id}</td>
              <td>
                {pedido.cliente
                  ? `${pedido.cliente.nombres} ${pedido.cliente.apellidos}`
                  : "Cliente no encontrado"}
              </td>
              <td>
                {new Date(pedido.fecha_pedido).toLocaleDateString("es-CL")}
              </td>
              <td>
                ${pedido.total_pedido?.toLocaleString().replace(",", ".")}
              </td>
              <td>
                <Badge
                  bg={
                    pedido.estado === "entregado"
                      ? "secondary"
                      : pedido.estado === "cancelado"
                        ? "danger"
                        : pedido.estado === "enviado"
                          ? "primary"
                          : pedido.estado === "en preparación"
                            ? "info"
                            : "primary"
                  }
                >
                  {pedido.estado.charAt(0).toUpperCase() +
                    pedido.estado.slice(1)}
                </Badge>
              </td>
              <td>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => verDetallePedido(pedido._id)}
                  className="me-2"
                >
                  Detalle
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const idNumerico =
                      typeof pedido._id === "number"
                        ? pedido._id
                        : parseInt(pedido._id);
                    if (!isNaN(idNumerico)) {
                      cargarPedidoParaEditar(idNumerico);
                    } else {
                      alert("ID de pedido inválido");
                    }
                  }}
                  className="me-2"
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setPedidoActual(pedido);
                    setShowModal({ ...showModal, eliminar: true });
                  }}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        show={showModal.nuevo}
        onHide={() => setShowModal({ ...showModal, nuevo: false })}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Pedido</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                name="id_cliente"
                value={pedidoActual.id_cliente}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente._id} value={cliente._id}>
                    {cliente.nombres} {cliente.apellidos}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fecha del Pedido</Form.Label>
              <Form.Control
                type="date"
                name="fecha_pedido"
                value={pedidoActual.fecha_pedido}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Método de Pago</Form.Label>
              <Form.Select
                name="metodo_pago"
                value={pedidoActual.metodo_pago}
                onChange={handleInputChange}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </Form.Select>
            </Form.Group>

            <h5 className="mt-4">Productos</h5>
            <div className="border p-3 mb-3">
              {pedidoActual.productos.length > 0 ? (
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidoActual.productos.map((producto, index) => {
                      const productoInfo = productosDisponibles.find(
                        (p) => p._id === producto.id_producto
                      );
                      return (
                        <tr key={index}>
                          <td>
                            {productoInfo?.nombre || "Producto no encontrado"}
                          </td>
                          <td>{producto.cantidad}</td>
                          <td>
                            $
                            {producto.precio_unitario
                              ?.toLocaleString()
                              .replace(",", ".")}
                          </td>
                          <td>
                            $
                            {producto.total_producto
                              ?.toLocaleString()
                              .replace(",", ".")}
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarProducto(index)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No hay productos agregados</p>
              )}

              <div className="mt-3">
                <h6>Agregar Producto</h6>
                <div className="d-flex gap-2">
                  <Form.Select
                    value={nuevoProducto.id_producto}
                    onChange={(e) => {
                      const selectedId = parseInt(e.target.value);
                      const producto = productosDisponibles.find(
                        (p) => p._id === selectedId
                      );

                      setNuevoProducto({
                        id_producto: selectedId.toString(),
                        cantidad: 1,
                        precio_unitario: producto?.precio || 0,
                        total_producto: 0,
                      });
                    }}
                  >
                    <option value="">Seleccione un producto</option>
                    {productosDisponibles.map((producto) => (
                      <option key={producto._id} value={producto._id}>
                        {producto.nombre} ($
                        {producto.precio?.toLocaleString().replace(",", ".")})
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Control
                    type="number"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) =>
                      setNuevoProducto({
                        ...nuevoProducto,
                        cantidad: e.target.value,
                        total_producto:
                          nuevoProducto.precio_unitario * e.target.value,
                      })
                    }
                    style={{ width: "100px" }}
                  />

                  <Button variant="primary" onClick={agregarProducto}>
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-end fw-bold fs-5">
              Total Pedido: $
              {pedidoActual.total_pedido?.toLocaleString().replace(",", ".") ||
                0}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal({ ...showModal, nuevo: false })}
          >
            Cancelar
          </Button>
          <Button variant="success" onClick={guardarPedido}>
            Crear Pedido
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para Detalle del Pedido */}
      <Modal
        show={showModal.detalle}
        onHide={() => setShowModal({ ...showModal, detalle: false })}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Detalle del Pedido #{pedidoActual._id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <h5>Información del Pedido</h5>
            <p>
              <strong>Cliente:</strong>{" "}
              {pedidoActual.cliente
                ? `${pedidoActual.cliente.nombres} ${pedidoActual.cliente.apellidos}`
                : pedidoActual.id_cliente
                  ? `Cliente ID: ${pedidoActual.id_cliente}`
                  : "Cliente no especificado"}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(pedidoActual.fecha_pedido).toLocaleDateString("es-CL")}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              <Badge
                bg={
                  pedidoActual.estado === "entregado"
                    ? "success"
                    : pedidoActual.estado === "cancelado"
                      ? "danger"
                      : pedidoActual.estado === "enviado"
                        ? "info"
                        : pedidoActual.estado === "en preparación"
                          ? "warning"
                          : "primary"
                }
              >
                {pedidoActual.estado.charAt(0).toUpperCase() +
                  pedidoActual.estado.slice(1)}
              </Badge>
            </p>
            <p>
              <strong>Método de Pago:</strong> {pedidoActual.metodo_pago}
            </p>
          </div>

          <h5>Productos</h5>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidoActual.productos?.map((producto, index) => {
                const productoInfo = productosDisponibles.find(
                  (p) => p._id === producto.id_producto
                );
                return (
                  <tr key={index}>
                    <td>{productoInfo?.nombre || "Producto no encontrado"}</td>
                    <td>{producto.cantidad}</td>
                    <td>
                      $
                      {producto.precio_unitario
                        ?.toLocaleString()
                        .replace(",", ".")}
                    </td>
                    <td>
                      $
                      {producto.total_producto
                        ?.toLocaleString()
                        .replace(",", ".")}
                    </td>
                  </tr>
                );
              })}
              <tr className="fw-bold">
                <td colSpan="3" className="text-end">
                  Total Pedido:
                </td>
                <td>
                  $
                  {pedidoActual.total_pedido
                    ?.toLocaleString()
                    .replace(",", ".")}
                </td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal({ ...showModal, detalle: false })}
          >
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showModal.editar}
        onHide={() => setShowModal({ ...showModal, editar: false })}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Editar Pedido #{pedidoActual._id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Select
                name="id_cliente"
                value={pedidoActual.id_cliente || ""}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente._id} value={cliente._id}>
                    {cliente.nombres} {cliente.apellidos}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Fecha del Pedido</Form.Label>
              <Form.Control
                type="date"
                name="fecha_pedido"
                value={pedidoActual.fecha_pedido || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Estado</Form.Label>
              <Form.Select
                name="estado"
                value={pedidoActual.estado || "solicitado"}
                onChange={handleInputChange}
              >
                <option value="solicitado">Solicitado</option>
                <option value="en preparación">En preparación</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </Form.Select>
            </Form.Group>

            <h5 className="mt-4">Productos</h5>
            <div className="border p-3 mb-3">
              {pedidoActual.productos?.length > 0 ? (
                <Table striped bordered size="sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unitario</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidoActual.productos.map((producto, index) => {
                      const productoInfo = productosDisponibles.find(
                        (p) =>
                          p._id.toString() === producto.id_producto.toString()
                      );
                      return (
                        <tr key={index}>
                          <td>
                            {productoInfo?.nombre ||
                              producto.nombre ||
                              "Producto no encontrado"}
                          </td>
                          <td>{producto.cantidad}</td>
                          <td>${producto.precio_unitario?.toLocaleString()}</td>
                          <td>${producto.total_producto?.toLocaleString()}</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => eliminarProducto(index)}
                            >
                              Eliminar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <p className="text-muted">No hay productos agregados</p>
              )}

              <div className="mt-3">
                <h6>Agregar Producto</h6>
                <div className="d-flex gap-2 align-items-center">
                  <Form.Select
                    value={nuevoProducto.id_producto}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const producto = productosDisponibles.find(
                        (p) => p._id.toString() === selectedId
                      );

                      setNuevoProducto({
                        id_producto: selectedId,
                        cantidad: 1,
                        precio_unitario: producto?.precio || 0,
                        total_producto: producto?.precio || 0,
                      });
                    }}
                    style={{ flex: 2 }}
                  >
                    <option value="">Seleccione un producto</option>
                    {productosDisponibles.map((producto) => (
                      <option key={producto._id} value={producto._id}>
                        {producto.nombre} (${producto.precio?.toLocaleString()})
                      </option>
                    ))}
                  </Form.Select>

                  <Form.Control
                    type="number"
                    min="1"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => {
                      const cantidad = parseInt(e.target.value) || 0;
                      setNuevoProducto({
                        ...nuevoProducto,
                        cantidad,
                        total_producto:
                          cantidad * nuevoProducto.precio_unitario,
                      });
                    }}
                    style={{ width: "100px" }}
                  />

                  <Button
                    variant="primary"
                    onClick={agregarProducto}
                    disabled={!nuevoProducto.id_producto}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-end fw-bold fs-5">
              Total Pedido: $
              {pedidoActual.productos
                ?.reduce((sum, p) => sum + (p.total_producto || 0), 0)
                ?.toLocaleString()}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal({ ...showModal, editar: false })}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={guardarPedido}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showModal.eliminar}
        onHide={() => setShowModal({ ...showModal, eliminar: false })}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro de eliminar el pedido #{pedidoActual._id}?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal({ ...showModal, eliminar: false })}
          >
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmarEliminarPedido}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
