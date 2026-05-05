import React, { useEffect, useState } from "react";
import Card from "../../components/Card.jsx";
import { api } from "../../api/client.js";

export default function HistoryCard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getHistory();
        setHistory(data || []);
      } catch (err) {
        console.error("Error al cargar historial:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card
      title="Últimos sitios autocompletados"
      subtitle="Lugares en donde la extensión ha llenado información recientemente"
    >
      {loading ? (
        <p className="muted">Cargando...</p>
      ) : history.length === 0 ? (
        <p className="muted">No hay historial todavía.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {history.map((item) => (
            <li key={item.id} style={{ marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <div style={{ fontWeight: 600 }}>{item.title || "Sin título"}</div>
              <div style={{ fontSize: "12px", color: "var(--muted)" }}>
                <a href={item.url} target="_blank" rel="noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>
                  {item.url}
                </a>
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                {new Date(item.filled_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

