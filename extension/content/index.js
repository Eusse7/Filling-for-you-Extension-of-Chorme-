globalThis.Autofill  = globalThis.Autofill  || {};

(function(ns) {
  let pendingPlan = null;
  let safeModeEnabled = true;

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

  const EMPTY_KNOWLEDGE = {
    about_me: "",
    strengths: "",
    salary_expectation: "",
    cover_letter: ""
  };

  async function syncTokenFromPage() {
    try {
      const token =
        localStorage.getItem("ffy_access_token") ||
        sessionStorage.getItem("ffy_access_token") ||
        "";
      await chrome.runtime.sendMessage({ type: "SET_TOKEN", token });
      return token;
    } catch {
      // Ignora errores de sincronización para no bloquear el flujo principal.
      return "";
    }
  }

  ns.submitGuard.installSubmitGuard(
    () => !!pendingPlan,
    () => safeModeEnabled
  );

  async function fetchProfileAndKnowledge() {
    const token = await syncTokenFromPage();
    if (!token) {
      throw new Error("No autenticado. Inicia sesión en http://localhost:5173 y vuelve a intentar.");
    }

    const [pr, kr] = await Promise.all([
      chrome.runtime.sendMessage({ type: "GET_PROFILE" }),
      chrome.runtime.sendMessage({ type: "GET_KNOWLEDGE" })
    ]);
    if (!pr.ok && pr.status === 401) {
      throw new Error("No autenticado. Inicia sesión en http://localhost:5173 y vuelve a intentar.");
    }
    if (!kr.ok && kr.status === 401) {
      throw new Error("No autenticado. Inicia sesión en http://localhost:5173 y vuelve a intentar.");
    }

    if (!pr.ok && !kr.ok) {
      const pDetail = pr?.data?.detail || pr?.error || `status ${pr?.status ?? "N/A"}`;
      const kDetail = kr?.data?.detail || kr?.error || `status ${kr?.status ?? "N/A"}`;
      throw new Error(`No se pudo obtener profile/knowledge (${pDetail}; ${kDetail})`);
    }

    const profile = pr.ok ? pr.data : EMPTY_PROFILE;
    const knowledge = kr.ok ? kr.data : EMPTY_KNOWLEDGE;

    if (!pr.ok) {
      ns.logger?.log("PROFILE_FALLBACK", { meta: { status: pr?.status, error: pr?.error || pr?.data?.detail || "unknown" } });
    }
    if (!kr.ok) {
      ns.logger?.log("KNOWLEDGE_FALLBACK", { meta: { status: kr?.status, error: kr?.error || kr?.data?.detail || "unknown" } });
    }

    return { profile, knowledge };
  }

  async function buildPlanFromPage() {
    const fields = ns.scan.scanFormFields();
    const { profile, knowledge } = await fetchProfileAndKnowledge();
    const plan = ns.plan.buildPlan(fields, profile, knowledge, ns.classify.guessKey);
    ns.logger?.log("PLAN_BUILT", { meta: { count: plan.length, safeMode: safeModeEnabled } });
    return plan;
  }

  function previewPlan(plan) {
    pendingPlan = plan;
    ns.overlay.renderPreview(
      plan,
      () => {
        pendingPlan = null;
        ns.logger?.log("PREVIEW_CANCEL");
      },
      () => {
        if (!pendingPlan) return;
        ns.apply.applyPlan(pendingPlan);
        ns.logger?.log("APPLY_CONFIRMED", { meta: { count: pendingPlan.length } });
        pendingPlan = null;
      }
    );
  }

  async function handlePreviewAndFill() {
    const plan = await buildPlanFromPage();
    if (safeModeEnabled) previewPlan(plan);
    else {
      ns.apply.applyPlan(plan);
      ns.logger?.log("APPLY_DIRECT", { meta: { count: plan.length } });
    }
    return { ok: true, mode: safeModeEnabled ? "preview" : "direct", count: plan.length };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
      try {
        switch (msg.type) {
          case "SCAN": {
            const fields = ns.scan.scanFormFields();
            ns.logger?.log("SCAN", { meta: { fields: fields.length } });
            sendResponse({ ok: true, fields });
            return;
          }
          case "PREVIEW_AND_FILL": {
            safeModeEnabled = !!msg.safeMode;
            sendResponse(await handlePreviewAndFill());
            return;
          }
          case "SET_SAFE_MODE": {
            safeModeEnabled = !!msg.safeMode;
            sendResponse({ ok: true, safeMode: safeModeEnabled });
            return;
          }
          default:
            sendResponse({ ok: false, error: "Unknown message" });
            return;
        }
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  });
})(globalThis.Autofill );
