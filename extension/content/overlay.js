globalThis.Autofill  = globalThis.Autofill  || {};

(function(ns) {
  let overlayEl = null;

  function escapeHtml(s) {
    return String(s).replaceAll(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c] || c));
  }

  function ensureOverlay(onCancel, onApply) {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement("div");
    overlayEl.id = "autofill-safe-overlay";
    overlayEl.innerHTML = `
      <div class="af-card">
        <div class="af-title">Previsualización (Modo seguro)</div>
        <div class="af-sub">Nada se llena hasta que presiones <b>Aplicar</b>.</div>
        <div id="af-list"></div>
        <div class="af-actions">
          <button id="af-cancel">Cerrar</button>
          <button id="af-apply">Aplicar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);

    overlayEl.querySelector("#af-cancel").onclick = () => {
      destroyOverlay();
      onCancel?.();
    };
    overlayEl.querySelector("#af-apply").onclick = () => {
      destroyOverlay();
      onApply?.();
    };

    return overlayEl;
  }

  function destroyOverlay() {
    if (!overlayEl) return;
    overlayEl.remove();
    overlayEl = null;
  }

  function renderPreview(plan, onCancel, onApply) {
    const ov = ensureOverlay(onCancel, onApply);
    const list = ov.querySelector("#af-list");
    list.innerHTML = plan.map(p => `
      <div class="af-row">
        <div class="af-left">
          <div class="af-key">${escapeHtml(p.key)}</div>
          <div class="af-meta">${escapeHtml(p.field.label || p.field.name || p.field.id || p.field.placeholder || "(sin etiqueta)")}</div>
        </div>
        <div class="af-right">${escapeHtml(String(p.value).slice(0, 140))}${String(p.value).length > 140 ? "…" : ""}</div>
      </div>
    `).join("");
  }

  ns.overlay = { renderPreview, destroyOverlay };
})(globalThis.Autofill );
