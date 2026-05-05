import React, { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import { api } from "../../api/client.js";

export default function BlacklistCard() {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function load() {
    try {
      const data = await api.getBlacklist();
      setBlacklist(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setErrorMsg("");
    try {
      await api.addBlacklist({ domain: newDomain.trim() });
      setNewDomain("");
      load();
    } catch (err) {
      setErrorMsg(err.message || "Error al agregar sitio a la lista negra.");
    }
  }

  async function handleRemove(id) {
    try {
      await api.removeBlacklist(id);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  let content;

  if (loading) {
    content = <p className="muted">Cargando...</p>;
  } else if (blacklist.length === 0) {
    content = <p className="muted">No has bloqueado ningún sitio.</p>;
  } else {
    content = (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {blacklist.map((item) => (
          <li key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 500 }}>{item.domain}</div>
            <button 
              type="button" 
              className="secondary" 
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => handleRemove(item.id)}
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card
      title="Lista negra"
      subtitle="Excluye el autocompletado en sitios web especí­ficos (máximo 10)"
    >
      {errorMsg && <p className="statusMessage" style={{ color: "#991b1b", background: "#fef2f2" }}>{errorMsg}</p>}
      
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <input 
          type="text" 
          placeholder="ej: linkedin.com" 
          value={newDomain} 
          onChange={(e) => setNewDomain(e.target.value)}
          disabled={blacklist.length >= 10}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={blacklist.length >= 10 || !newDomain.trim()}>Añadir</button>
      </form>

      {content}
    </Card>
  );
}

