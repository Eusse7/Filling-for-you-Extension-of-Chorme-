import React from "react";
import Card from "../../components/Card.jsx";
import { useKnowledge } from "./useKnowledge.js";

export default function KnowledgeForm() {
  const { knowledge, setKnowledge, status, save } = useKnowledge();

  if (!knowledge) {
    return (
      <Card title="Conocimiento del candidato" subtitle="Cargando...">
        <p className="muted">{status || "Cargando..."}</p>
      </Card>
    );
  }

  return (
    <Card
      title="Conocimiento del candidato"
      subtitle="Respuestas largas para textareas"
      right={<button onClick={() => save(knowledge)}>Guardar</button>}
    >
      <p className="muted">Estado: {status}</p>

      <label>
        <span>Cuéntanos sobre ti</span>
        <textarea rows={4} value={knowledge.about_me} onChange={(e)=>setKnowledge({...knowledge, about_me:e.target.value})} />
      </label>
      <label>
        <span>Fortalezas</span>
        <textarea rows={3} value={knowledge.strengths} onChange={(e)=>setKnowledge({...knowledge, strengths:e.target.value})} />
      </label>
      <label>
        <span>Expectativa salarial</span>
        <textarea rows={2} value={knowledge.salary_expectation} onChange={(e)=>setKnowledge({...knowledge, salary_expectation:e.target.value})} />
      </label>
      <label>
        <span>Carta/introducción</span>
        <textarea rows={4} value={knowledge.cover_letter} onChange={(e)=>setKnowledge({...knowledge, cover_letter:e.target.value})} />
      </label>
    </Card>
  );
}
