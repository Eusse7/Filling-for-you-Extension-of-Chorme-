import React from "react";
import Card from "../../components/Card.jsx";
import { useProfile } from "./useProfile.js";

export default function ProfileForm() {
  const { profile, setProfile, status, save } = useProfile();

  if (!profile) {
    return (
      <Card title="Perfil" subtitle="Cargando...">
        <p className="muted">{status || "Cargando..."}</p>
      </Card>
    );
  }

  return (
    <Card
      title="Perfil"
      subtitle="Lo usa la extensión para autocompletar"
      right={<button onClick={() => save(profile)}>Guardar</button>}
    >
      <p className="muted">Estado: {status}</p>

      <div className="row2">
        <label>
          <span>Nombre</span>
          <input value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} />
        </label>
        <label>
          <span>Apellido</span>
          <input value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} />
        </label>
      </div>

      <div className="row2">
        <label>
          <span>Email</span>
          <input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} />
        </label>
        <label>
          <span>Teléfono</span>
          <input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
        </label>
      </div>

      <label>
        <span>Dirección</span>
        <input value={profile.addressLine1} onChange={(e) => setProfile({...profile, addressLine1: e.target.value})} />
      </label>

      <div className="row2">
        <label>
          <span>Ciudad</span>
          <input value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} />
        </label>
        <label>
          <span>País</span>
          <input value={profile.country} onChange={(e) => setProfile({...profile, country: e.target.value})} />
        </label>
      </div>

      <div className="row2">
        <label>
          <span>LinkedIn</span>
          <input value={profile.linkedin} onChange={(e) => setProfile({...profile, linkedin: e.target.value})} />
        </label>
        <label>
          <span>GitHub</span>
          <input value={profile.github} onChange={(e) => setProfile({...profile, github: e.target.value})}
          />
        </label>
      </div>
    </Card>
  );
}
