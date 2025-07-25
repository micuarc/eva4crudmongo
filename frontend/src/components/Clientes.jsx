import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [clienteActual, setClienteActual] = useState({});
  const [copiaClienteActual, setCopiaClienteActual] = useState({});
  const [estadoCliente, setEstadoCliente] = useState("");

  const apiFetch = async () => {
    const res = await fetch("/api/clientes"); //ruta a la api de clientes, tg qe ver con docker
    const data = await res.json();
    setClientes(data);
  };

  const activarEdicionCliente = (cliente) => {
    setClienteActual({ ...cliente, direccion: { ...cliente.direccion } });
    setCopiaClienteActual({ ...cliente, direccion: { ...cliente.direccion } });
    setModalEdicion(true);
  };

  const activarEliminarCliente = (cliente) => {
    setClienteActual(cliente);
    setModalEliminar(true);
  };

  const eliminarClienteHard = async (id_cliente) => {
    // await fetch(`/api/clientes/${id_cliente}`, {
    //   method: "DELETE", //verificar la ruta de nuevo
    // });
    setModalEliminar(false);
    apiFetch();
  };

  //VER CASO DE EDICION CLIENTE Y EDICION DE ESTADO.
  //GUIARSE POR:

  const guardarCliente = async () => {
    // await fetch("/api/clientes/", {
    //   method: "PATCH",
    //   body: JSON.stringify(clienteActual),
    // });
    setModalEdicion(false);
    apiFetch();
  };

  //ver cómo implementar para dirección
  const actualizarCliente = (e) => {
    const nombreInput = e.target.name;
    const nuevoValorInput = e.target.value;

    setClienteActual((datosPrevios) => {
      ({
        ...datosPrevios,
        nombreInput: nuevoValorInput,
      });
    });
  };

  const cancelarEdicion = () => {
    setClienteActual(copiaClienteActual);
    setModalEdicion(false);
  };

  const cancelarEliminar = () => {
    setModalEliminar(false);
    setClienteActual({});
  };

  useEffect(() => {
    apiFetch();
  }, []);

  return (
    <>
      <Container>
        <Table className="col-11" hover borderless striped>
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Dirección</th>
              <th>Fecha Registro</th>
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
                  {cliente.direccion?.calle}, {cliente.direccion?.numero},{" "}
                  {cliente.direccion?.ciudad}
                </td>
                <td>{cliente.fecha_registro}</td>
                <td>
                  <Button
                    variant="warning"
                    size="sm"
                    className="text-light px-3"
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
                  autoFocus
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
                    <option value="">Seleccione estado</option>
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
            <Button variant="primary" onClick={guardarCliente}>
              Guardar Cambios
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
