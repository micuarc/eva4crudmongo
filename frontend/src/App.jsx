import { useEffect, useState } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";
import Clientes from "./components/Clientes";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Navbar
        bg="primary"
        data-bs-theme="dark"
        className="fixed-top navbar-expand-lg"
      >
        <Container>
          <Navbar.Brand href="#home">ComercioTech</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#pedidos">Pedidos</Nav.Link>
            <Nav.Link href="#productos">Productos</Nav.Link>
            <Nav.Link href="#clientes">Clientes</Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container>
        <h1 className="m-5">Plataforma de Administración</h1>
        <Clientes />
      </Container>
    </>
  );
}

export default App;
