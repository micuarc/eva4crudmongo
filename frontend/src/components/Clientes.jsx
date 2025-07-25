import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [clienteActual, setClienteActual] = useState({
    nombres: "",
    apellidos: "",
    direccion: {
      calle: "",
      numero: "",
      ciudad: "",
    },
    fecha_registro: new Date().toISOString().split("T")[0],
  });
  const [copiaClienteActual, setCopiaClienteActual] = useState({});
  const [estadoCliente, setEstadoCliente] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("");
  const [clienteBuscado, setClienteBuscado] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);

  const apiFetch = async () => {
    const res = await fetch("/api/clientes");
    const data = await res.json();
    setClientes(data);
  };

  const buscarPorCiudad = async () => {
    if (!filtroCiudad.trim()) {
      apiFetch();
      return;
    }

    try {
      const res = await fetch(`/api/clientes/ciudad/${filtroCiudad}`);
      const data = await res.json();

      if (data instanceof Array) {
        // si la respuesta es exitosa, el endpoint nos devolvera un array de ids,
        // con ellos, buscamos los clientes completos
        const clientes_detallados = await Promise.all(
          data.map(async (id) => {
            const res = await fetch(`/api/clientes/${id}`);
            return await res.json();
          })
        );
        setClientes(clientes_detallados);
      } else {
        setClientes([]);
      }
    } catch (err) {
      setError("Error al buscar por ciudad");
      console.error(err);
    }
  };

  const ver_cliente_porID = async (id) => {
    try {
      const res = await fetch(`/api/clientes/${id}`);
      const data = await res.json();
      setClienteBuscado(data);
      setModalDetalle(true);
    } catch (err) {
      console.error(err);
    }
  };

  const activarEdicionCliente = (cliente) => {
    setClienteActual({
      ...cliente,
      direccion: {
        calle: cliente.direccion?.calle || "",
        numero: cliente.direccion?.numero || "",
        ciudad: cliente.direccion?.ciudad || "",
      },
      fecha_registro: cliente.fecha_registro
        ? new Date(cliente.fecha_registro).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setCopiaClienteActual({ ...cliente, direccion: { ...cliente.direccion } });
    setModalEdicion(true);
  };

  const activarEliminarCliente = (cliente) => {
    setClienteActual(cliente);
    setModalEliminar(true);
  };

  const eliminarClienteHard = async (id_cliente) => {
    await fetch(`/api/clientes/${id_cliente}`, {
      method: "DELETE",
    });
    setModalEliminar(false);
    apiFetch();
  };

  //VER CASO DE EDICION CLIENTE Y EDICION DE ESTADO.
  //GUIARSE POR:

  const guardarCliente = async () => {
    try {
      if (
        !clienteActual.nombres ||
        !clienteActual.apellidos ||
        !clienteActual.direccion.calle ||
        !clienteActual.direccion.ciudad
      ) {
        alert("Por favor complete todos los campos obligatorios");
        return;
      }

      const method = clienteActual._id ? "PATCH" : "POST"; //vemos si es para actualizar o agregar
      const url = clienteActual._id
        ? `/api/clientes/${clienteActual._id}`
        : "/api/clientes";

      const fechaRegistro =
        clienteActual.fecha_registro instanceof Date
          ? clienteActual.fecha_registro.toISOString()
          : clienteActual.fecha_registro;

      const body = {
        nombres: clienteActual.nombres,
        apellidos: clienteActual.apellidos,
        direccion: {
          calle: clienteActual.direccion.calle,
          numero: clienteActual.direccion.numero,
          ciudad: clienteActual.direccion.ciudad,
        },
        fecha_registro: new Date(clienteActual.fecha_registro),
        estado: clienteActual.estado || "nuevo",
      };

      console.log("Datos a enviar:", { method, url, body });

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const resData = await res.json();
      console.log("Respuesta del servidor:", resData);

      if (!res.ok) {
        throw new Error("Error al guardar el cliente");
      }

      console.log("Enviando datos:", {
        method,
        url,
        body: JSON.stringify(body, null, 2),
      });

      setModalEdicion(false);
      setModalNuevo(false);
      apiFetch();
    } catch (err) {
      console.error(err);
    }
  };

  const cambiarEstadoCliente = async () => {
    try {
      await fetch(`/api/clientes/cambiar_estado/${clienteActual._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: clienteActual.estado }),
      });
      setModalEdicion(false);
      apiFetch();
    } catch (err) {
      setError("Error al cambiar el estado del cliente");
      console.error(err);
    }
  };

  const actualizarCliente = (e) => {
    const nombreInput = e.target.name;
    const nuevoValorInput = e.target.value;

    if (nombreInput.startsWith("direccion.")) {
      const celdaInput = nombreInput.split(".")[1];
      setClienteActual((datosPrevios) => ({
        ...datosPrevios,
        direccion: {
          ...datosPrevios.direccion,
          [celdaInput]: nuevoValorInput,
        },
      }));
    } else {
      setClienteActual((datosPrevios) => ({
        ...datosPrevios,
        [nombreInput]: nuevoValorInput,
      }));
    }
  };

  const cancelarEdicion = () => {
    setClienteActual(copiaClienteActual);
    setModalEdicion(false);
    setModalNuevo(false);
  };

  const cancelarEliminar = () => {
    setModalEliminar(false);
    setClienteActual({});
  };

  const abrirModalNuevo = () => {
    setClienteActual({
      nombres: "",
      apellidos: "",
      direccion: {
        calle: "",
        numero: "",
        ciudad: "",
      },
      fecha_registro: new Date().toISOString(),
      estado: "nuevo", // Asegurar estado inicial
    });
    setModalNuevo(true);
  };

  const atributosBadgeEstado = (estado) => {
    let bg;
    if (estado === "activo") bg = "primary";
    if (estado === "inactivo") bg = "secondary";
    if (estado === "nuevo") bg = "success";
    return bg;
  };

  useEffect(() => {
    apiFetch();
  }, []);

  return (
    <>
      <Container>
        <h1 className="my-5">Panel de Clientes</h1>
        <div className="d-flex justify-content-between mb-3">
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Filtrar por ciudad"
              value={filtroCiudad}
              onChange={(e) => {
                setFiltroCiudad(e.target.value);
                apiFetch();
              }}
              className="me-2"
            />
            <Button
              variant="primary"
              className="mx-1"
              onClick={buscarPorCiudad}
            >
              Buscar
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => {
                setFiltroCiudad("");
                apiFetch();
              }}
            >
              Limpiar
            </Button>
          </div>
          <Button variant="success" onClick={abrirModalNuevo}>
            Nuevo Cliente
          </Button>
        </div>
        <Table className="col-11" bordered hover responsive>
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Dirección</th>
              <th>Fecha Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente._id}>
                <td>{cliente._id}</td>
                <td>{cliente.nombres}</td>
                <td>{cliente.apellidos}</td>
                <td>
                  {cliente.direccion?.calle} {cliente.direccion?.numero},{" "}
                  {cliente.direccion?.ciudad}
                </td>
                <td>
                  {new Date(cliente.fecha_registro).toLocaleDateString("es-CL")}
                </td>
                <td>
                  <Badge
                    pill
                    bg={atributosBadgeEstado(cliente.estado)}
                    className="py-1 px-2"
                  >
                    {cliente.estado.charAt(0).toUpperCase() +
                      cliente.estado.slice(1)}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-light px-3 mx-2"
                    onClick={() => activarEdicionCliente(cliente)}
                  >
                    Editar
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="text-light px-2"
                    onClick={() => activarEliminarCliente(cliente)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
            <tr></tr>
          </tbody>
        </Table>

        <Modal show={modalEdicion} onHide={cancelarEdicion}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-5">Editar Cliente</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="formEdicion.Nombres">
                <Form.Label>Nombres</Form.Label>
                <Form.Control
                  type="text"
                  name="nombres"
                  value={clienteActual.nombres || ""}
                  onChange={actualizarCliente}
                  autoFocus
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formEdicion.Apellidos">
                <Form.Label>Apellidos</Form.Label>
                <Form.Control
                  type="text"
                  name="apellidos"
                  value={clienteActual.apellidos || ""}
                  onChange={actualizarCliente}
                />{" "}
              </Form.Group>
              <Form.Label>Dirección</Form.Label>
              <Form.Group className="mb-3" controlId="formEdicion.Dirección">
                <Form.Label>Calle</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion.calle"
                  value={clienteActual.direccion?.calle || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formEdicion.Numero">
                <Form.Label>N°</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion.numero"
                  value={clienteActual.direccion?.numero || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formEdicion.Ciudad">
                <Form.Label>Ciudad</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion.ciudad"
                  value={clienteActual.direccion?.ciudad || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
              <Form.Group
                className="mb-3"
                controlId="formEdicion.ActivarEdicionEstado"
              >
                <Form.Check
                  type="checkbox"
                  label="Activar Edición de Estado"
                  checked={estadoCliente}
                  onChange={(e) => setEstadoCliente(e.target.checked)}
                />
              </Form.Group>
              {estadoCliente && (
                <Form.Group className="mb-3" controlId="formEdicion.Estado">
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="estado"
                    value={clienteActual.estado || ""}
                    onChange={actualizarCliente}
                  >
                    <option value="nuevo">Nuevo</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </Form.Select>
                </Form.Group>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelarEdicion}>
              Cancelar
            </Button>
            {estadoCliente ? (
              <Button variant="info" onClick={cambiarEstadoCliente}>
                Cambiar Estado
              </Button>
            ) : (
              <Button variant="primary" onClick={guardarCliente}>
                Guardar Cambios
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        <Modal show={modalNuevo} onHide={cancelarEdicion}>
          <Modal.Header closeButton>
            <Modal.Title className="fs-5">Nuevo Cliente</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3" controlId="formNuevo.Nombres">
                <Form.Label>Nombres</Form.Label>
                <Form.Control
                  type="text"
                  name="nombres"
                  value={clienteActual.nombres || ""}
                  onChange={actualizarCliente}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formNuevo.Apellidos">
                <Form.Label>Apellidos</Form.Label>
                <Form.Control
                  type="text"
                  name="apellidos"
                  value={clienteActual.apellidos || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
              <Form.Label>Dirección</Form.Label>
              <Form.Group className="mb-3" controlId="formNuevo.Calle">
                <Form.Label>Calle</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion.calle"
                  value={clienteActual.direccion?.calle || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formNuevo.Numero">
                <Form.Label>N°</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion.numero"
                  value={clienteActual.direccion?.numero || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formNuevo.Ciudad">
                <Form.Label>Ciudad</Form.Label>
                <Form.Control
                  type="text"
                  name="direccion.ciudad"
                  value={clienteActual.direccion?.ciudad || ""}
                  onChange={actualizarCliente}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelarEdicion}>
              Cancelar
            </Button>
            <Button variant="success" onClick={guardarCliente}>
              Crear Cliente
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={modalEliminar} onHide={cancelarEliminar} centered>
          <Modal.Header closeButton>
            <Modal.Title id="contained-modal-title-vcenter">
              Eliminar cliente
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              ¿Está seguro de eliminar al cliente{" "}
              <strong>{`${clienteActual.nombres} ${clienteActual.apellidos}`}</strong>
              ?<br />
              Esta acción no puede revertise.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="danger"
              size="sm"
              className="text-light px-2"
              onClick={() => eliminarClienteHard(clienteActual._id)}
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
