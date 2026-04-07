import React from "react";
import AdminPage from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <h1>Filling for you</h1>
          <p>Panel de perfil y conocimiento</p>
          <p>
            Para probar la extensión usa{" "}
            <a href="/form-test.html" target="_blank" rel="noreferrer">
              /form-test.html
            </a>
          </p>
        </div>
      </header>

      <main className="main"><AdminPage /></main>

      <footer className="footer">
        <span>API: http://localhost:3000</span>
        <span>Web: http://localhost:5173</span>
      </footer>
    </div>
  );
}
