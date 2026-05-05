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

  const WEB_ORIGINS = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

  async function syncTokenFromPage() {
    try {
      const tokenFromPage =
        localStorage.getItem("ffy_access_token") ||
        sessionStorage.getItem("ffy_access_token") ||
        "";

      if (tokenFromPage) {
        await chrome.runtime.sendMessage({ type: "SET_TOKEN", token: tokenFromPage });
        return tokenFromPage;
      }

      if (WEB_ORIGINS.has(globalThis.location.origin)) {
        await chrome.runtime.sendMessage({ type: "SET_TOKEN", token: "" });
        return "";
      }

      const stored = await chrome.runtime.sendMessage({ type: "GET_TOKEN" });
      return stored?.ok ? (stored.token || "") : "";
    } catch {
      // Ignora errores de sincronización para no bloquear el flujo principal.
      return "";
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!WEB_ORIGINS.has(event.origin)) return;
    const messageType = event.data?.type;

    if (messageType === "FFY_LOGOUT") {
      chrome.runtime.sendMessage({ type: "SET_TOKEN", token: "" });
      return;
    }

    if (messageType === "FFY_LOGIN" && event.data?.token) {
      chrome.runtime.sendMessage({ type: "SET_TOKEN", token: event.data.token });
    }
  });

  async function checkBlacklist() {
    try {
      const currentDomain = location.hostname;
      const bl = await chrome.runtime.sendMessage({ type: "GET_BLACKLIST" });
      if (bl?.ok && Array.isArray(bl.data)) {
        return bl.data.some(b => currentDomain === b.domain || currentDomain.endsWith("." + b.domain));
      }
      return false;
    } catch {
      return false;
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
    const fieldElements = ns.scan.getCachedElements();
    const { profile, knowledge } = await fetchProfileAndKnowledge();
    const plan = ns.plan.buildPlan(fields, profile, knowledge, ns.classify.guessKey, fieldElements);
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
        chrome.runtime.sendMessage({ type: "RECORD_HISTORY", url: globalThis.location.href, title: document.title });
        pendingPlan = null;
      }
    );
  }

  async function handlePreviewAndFill() {
    const isBlacklisted = await checkBlacklist();
    if (isBlacklisted) {
      alert("La extensión Filling-for-you está desactivada en este sitio.");
      ns.logger?.log("BLACKLISTED_SITE", { meta: { domain: location.hostname } });
      return { ok: false, error: "Blacklisted site" };
    }

    const plan = await buildPlanFromPage();
    if (safeModeEnabled) previewPlan(plan);
    else {
      ns.apply.applyPlan(plan);
      ns.logger?.log("APPLY_DIRECT", { meta: { count: plan.length } });
      chrome.runtime.sendMessage({ type: "RECORD_HISTORY", url: globalThis.location.href, title: document.title });
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
          case "CLEAR_FIELDS": {
            ns.apply.clearFilledFields?.();
            sendResponse({ ok: true });
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
