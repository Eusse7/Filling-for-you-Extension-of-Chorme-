import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

const EMPTY_KNOWLEDGE = {
  about_me: "",
  strengths: "",
  salary_expectation: "",
  cover_letter: ""
};

export function useKnowledge() {
  const [knowledge, setKnowledge] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setStatus("Cargando conocimiento...");
        const k = await api.get("/knowledge");
        setKnowledge(k ?? EMPTY_KNOWLEDGE);
        setStatus("Listo.");
      } catch (e) {
        setKnowledge(EMPTY_KNOWLEDGE);
        setStatus(`No se pudo cargar desde API. Puedes completar y guardar manualmente. (${String(e)})`);
      }
    })();
  }, []);

  async function save(next) {
    try {
      setStatus("Guardando conocimiento...");
      const updated = await api.put("/knowledge", next);
      setKnowledge(updated);
      setStatus("Conocimiento guardado.");
      return updated;
    } catch (e) {
      setStatus(String(e));
      throw e;
    }
  }

  return { knowledge, setKnowledge, status, save };
}
