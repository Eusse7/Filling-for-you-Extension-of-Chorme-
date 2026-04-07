import { useEffect, useState } from "react";
import { api } from "../../api/client.js";

const EMPTY_PROFILE = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  city: "",
  country: "",
  linkedin: "",
  github: ""
};

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setStatus("Cargando perfil...");
        const p = await api.get("/profile");
        setProfile(p ?? EMPTY_PROFILE);
        setStatus("Listo.");
      } catch (e) {
        setProfile(EMPTY_PROFILE);
        setStatus(`No se pudo cargar desde API. Puedes completar y guardar manualmente. (${String(e)})`);
      }
    })();
  }, []);

  async function save(next) {
    try {
      setStatus("Guardando perfil...");
      const updated = await api.put("/profile", next);
      setProfile(updated);
      setStatus("Perfil guardado.");
      return updated;
    } catch (e) {
      setStatus(String(e));
      throw e;
    }
  }

  return { profile, setProfile, status, save };
}
