import { useEffect, useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import Clientes from "./components/Clientes";
import Pedidos from "./components/Pedidos";
import Productos from "./components/Productos";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

function App() {
  const [componenteActual, setComponenteActual] = useState(null);

  const renderizarComponente = () => {
    switch (componenteActual) {
      case "pedidos":
        return <Pedidos />;
      case "productos":
        return <Productos />;
      case "clientes":
        return <Clientes />;
      default:
        return (
          <div>
            <h1 className="m-5">Plataforma de Administración</h1>
            <p className="text-center mt-5 fs-5">
              <i>
                Para comenzar, escoja alguno de los paneles indicados en la
                parte superior de su pantalla.
              </i>
            </p>
          </div>
        );
    }
  };

  return (
    <>
      <Navbar
        bg="primary"
        data-bs-theme="dark"
        className="fixed-top navbar-expand-lg"
      >
        <Container>
          <Navbar.Brand href="#home" onClick={() => setComponenteActual(null)}>
            ComercioTech
          </Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link
              href="#pedidos"
              onClick={() => setComponenteActual("pedidos")}
            >
              Pedidos
            </Nav.Link>
            <Nav.Link
              href="#productos"
              onClick={() => setComponenteActual("productos")}
            >
              Productos
            </Nav.Link>
            <Nav.Link
              href="#clientes"
              onClick={() => setComponenteActual("clientes")}
            >
              Clientes
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container>{renderizarComponente()}</Container>
    </>
  );
}

export default App;
