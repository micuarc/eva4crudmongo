import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoActual, setProductoActual] = useState({
    nombre: "",
    precio: 0,
    stock: 0,
    fecha_vencimiento: new Date().toISOString().split("T")[0],
    estado: "activo",
  });
  const [copiaProductoActual, setCopiaProductoActual] = useState({});
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroStock, setFiltroStock] = useState("");

  // Fetch inicial de datos
  const apiFetch = async () => {
    try {
      const res = await fetch("/api/productos");
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  // Buscar productos por estado
  const buscarPorEstado = async () => {
    try {
      let url = "/api/productos";
      if (filtroEstado) {
        url += `/estado/${filtroEstado}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setProductos(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Activar edición de producto
  const activarEdicionProducto = (producto) => {
    setProductoActual({
      ...producto,
      fecha_vencimiento: producto.fecha_vencimiento
        ? new Date(producto.fecha_vencimiento).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setCopiaProductoActual({ ...producto });
    setModalEdicion(true);
  };

  // Activar eliminación de producto
  const activarEliminarProducto = (producto) => {
    setProductoActual(producto);
    setModalEliminar(true);
  };

  // Eliminar producto
  const eliminarProducto = async (id_producto) => {
    await fetch(`/api/productos/${id_producto}`, {
      method: "DELETE",
    });
    setModalEliminar(false);
    apiFetch();
  };

  // Guardar producto (crear o actualizar)
  const guardarProducto = async () => {
    try {
      if (
        !productoActual.nombre ||
        productoActual.precio <= 0 ||
        productoActual.stock < 0
      ) {
        alert("Por favor complete los campos requeridos");
        return;
      }

      const method = productoActual._id ? "PATCH" : "POST";
      const url = productoActual._id
        ? `/api/productos/${productoActual._id}`
        : "/api/productos";

      const body = {
        nombre: productoActual.nombre.trim(),
        precio: parseFloat(productoActual.precio),
        stock: parseInt(productoActual.stock),
        estado: productoActual.estado || "activo",
      };

      if (productoActual.fecha_vencimiento) {
        body.fecha_vencimiento = productoActual.fecha_vencimiento;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Error al guardar el producto");
      }

      setModalEdicion(false);
      setModalNuevo(false);
      apiFetch();

      alert(
        `Producto ${productoActual._id ? "actualizado" : "creado"} correctamente`
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Cambiar estado del producto
  const cambiarEstadoProducto = async () => {
    try {
      await fetch(`/api/productos/cambiar_estado/${productoActual._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: productoActual.estado }),
      });
      setModalEdicion(false);
      apiFetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Actualizar datos del producto en el formulario
  const actualizarProducto = (e) => {
    const { name, value } = e.target;
    setProductoActual((prev) => ({ ...prev, [name]: value }));
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setProductoActual(copiaProductoActual);
    setModalEdicion(false);
    setModalNuevo(false);
  };

  // Cancelar eliminación
  const cancelarEliminar = () => {
    setModalEliminar(false);
    setProductoActual({});
  };

  // Abrir modal para nuevo producto
  const abrirModalNuevo = () => {
    setProductoActual({
      nombre: "",
      precio: 0,
      stock: 0,
      fecha_vencimiento: new Date().toISOString().split("T")[0],
      estado: "activo",
    });
    setModalNuevo(true);
  };

  useEffect(() => {
    apiFetch();
  }, []);

  return (
    <>
      <Container>
        <h1 className="my-5">Panel de Productos</h1>
        <div className="d-flex justify-content-between mb-3">
          <div className="d-flex gap-2">
            <div className="d-flex">
              <Form.Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="me-2"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Form.Select>
              <Button
                variant="primary"
                className="mx-1"
                onClick={buscarPorEstado}
              >
                Filtrar
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => {
                  setFiltroEstado("");
                  apiFetch();
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
          <Button variant="success" onClick={abrirModalNuevo}>
            Nuevo Producto
          </Button>
        </div>
        <Table className="col-11" bordered hover responsive>
          <thead className="table-primary">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto._id}>
                <td>{producto._id}</td>
                <td>{producto.nombre}</td>
                <td>
                  ${producto.precio?.toLocaleString().replace(",", ".") || 0}
                </td>
                <td>{producto.stock}</td>
                <td>
                  {producto.fecha_vencimiento
                    ? new Date(producto.fecha_vencimiento).toLocaleDateString(
                        "es-CL"
                      )
                    : "N/A"}
                </td>
                <td>
                  <Badge
                    bg={producto.estado === "activo" ? "primary" : "secondary"}
                  >
                    {producto.estado.charAt(0).toUpperCase() +
                      producto.estado.slice(1)}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-light px-3 me-2"
                    onClick={() => activarEdicionProducto(producto)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-light px-2"
                    onClick={() => activarEliminarProducto(producto)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Modal de Edición */}
        <Modal show={modalEdicion} onHide={cancelarEdicion}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-5">Editar Producto</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="formEdicion.Nombre">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={productoActual.nombre || ""}
                  onChange={actualizarProducto}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEdicion.Precio">
                <Form.Label>Precio</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  name="precio"
                  value={productoActual.precio || 0}
                  onChange={actualizarProducto}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEdicion.Stock">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="stock"
                  value={productoActual.stock || 0}
                  onChange={actualizarProducto}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEdicion.Vencimiento">
                <Form.Label>Fecha de Vencimiento</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha_vencimiento"
                  value={
                    productoActual.fecha_vencimiento
                      ? productoActual.fecha_vencimiento.split("T")[0]
                      : ""
                  }
                  onChange={actualizarProducto}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formEdicion.Estado">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  name="estado"
                  value={productoActual.estado || "activo"}
                  onChange={actualizarProducto}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelarEdicion}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={guardarProducto}>
              Guardar Cambios
            </Button>
            <Button variant="info" onClick={cambiarEstadoProducto}>
              Solo Cambiar Estado
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Nuevo Producto */}
        <Modal show={modalNuevo} onHide={cancelarEdicion}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-5">Nuevo Producto</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="formNuevo.Nombre">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={productoActual.nombre || ""}
                  onChange={actualizarProducto}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formNuevo.Precio">
                <Form.Label>Precio</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  name="precio"
                  value={productoActual.precio || 0}
                  onChange={actualizarProducto}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formNuevo.Stock">
                <Form.Label>Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  name="stock"
                  value={productoActual.stock || 0}
                  onChange={actualizarProducto}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formNuevo.Vencimiento">
                <Form.Label>Fecha de Vencimiento</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha_vencimiento"
                  value={productoActual.fecha_vencimiento || ""}
                  onChange={actualizarProducto}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formNuevo.Estado">
                <Form.Label>Estado</Form.Label>
                <Form.Select
                  name="estado"
                  value={productoActual.estado || "activo"}
                  onChange={actualizarProducto}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </Form.Select>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelarEdicion}>
              Cancelar
            </Button>
            <Button variant="success" onClick={guardarProducto}>
              Crear Producto
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Eliminación */}
        <Modal show={modalEliminar} onHide={cancelarEliminar} centered>
          <Modal.Header closeButton>
            <Modal.Title>Eliminar producto</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              ¿Está seguro de eliminar el producto{" "}
              <strong>{productoActual.nombre}</strong> (ID: {productoActual._id}
              )?
              <br />
              Esta acción no puede revertise.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="danger"
              size="sm"
              className="text-light px-2"
              onClick={() => eliminarProducto(productoActual._id)}
            >
              Confirmar Eliminación
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="text-light px-2"
              onClick={cancelarEliminar}
            >
              Volver
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
}
