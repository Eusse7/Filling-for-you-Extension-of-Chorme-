import React from "react";
import Card from "../components/Card.jsx";
import ProfileForm from "../features/profile/ProfileForm.jsx";
import KnowledgeForm from "../features/knowledge/KnowledgeForm.jsx";

export default function AdminPage() {
  return (
    <div className="grid">
      <ProfileForm />
      <KnowledgeForm />
    </div>
  );
}
