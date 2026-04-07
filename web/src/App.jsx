import React from "react";
import AdminPage from "./pages/AdminPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { authApi, getAccessToken, setAccessToken } from "./api/client.js";

export default function App() {
  const [authChecked, setAuthChecked] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const token = getAccessToken();
      if (!token) {
        setAuthChecked(true);
        return;
      }

      try {
        await authApi.me();
        setIsAuthenticated(true);
      } catch {
        setAccessToken("");
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  function handleAuthSuccess() {
    setIsAuthenticated(true);
  }

  function handleLogout() {
    setAccessToken("");
    setIsAuthenticated(false);
  }

  if (!authChecked) {
    return <div className="app"><main className="main">Cargando...</main></div>;
  }

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
        {isAuthenticated && <button onClick={handleLogout}>Cerrar sesión</button>}
      </header>

      <main className="main">
        {isAuthenticated ? <AdminPage /> : <AuthPage onAuth={handleAuthSuccess} />}
      </main>

      <footer className="footer">
        <span>API: http://localhost:3000</span>
        <span>Web: http://localhost:5173</span>
      </footer>
    </div>
  );
}
