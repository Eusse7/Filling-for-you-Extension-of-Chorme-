import React from "react";
import ProfileForm from "../features/profile/ProfileForm.jsx";
import KnowledgeForm from "../features/knowledge/KnowledgeForm.jsx";
import HistoryCard from "../features/history/HistoryCard.jsx";
import BlacklistCard from "../features/blacklist/BlacklistCard.jsx";

export default function AdminPage() {
  return (
    <>
      <div className="grid">
        <ProfileForm />
        <KnowledgeForm />
      </div>
      <div className="grid" style={{ marginTop: "14px" }}>
        <HistoryCard />
        <BlacklistCard />
      </div>
    </>
  );
}
