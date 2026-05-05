globalThis.Autofill  = globalThis.Autofill  || {};

(function(ns) {
  function dispatchFrameworkEvents(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setValue(el, value) {
    const before = el.value;
    el.value = value;
    dispatchFrameworkEvents(el);
    ns.logger?.log("SET_VALUE", {
      field: { name: el.name, id: el.id, autocomplete: el.autocomplete, tag: el.tagName.toLowerCase() },
      meta: { changed: before !== value }
    });
  }

  let lastAppliedFields = [];

  function applyPlan(plan) {
    lastAppliedFields = [];
    for (const item of plan) {
      const sel = item.field.selectorHint;
      if (!sel) continue;
      const el = document.querySelector(sel);
      if (!el) continue;
      setValue(el, item.value);
      lastAppliedFields.push(el);
    }
  }

  function clearFilledFields() {
    for (const el of lastAppliedFields) {
      if (el) {
        setValue(el, "");
      }
    }
    ns.logger?.log("CLEAR_FIELDS", { meta: { count: lastAppliedFields.length } });
    lastAppliedFields = [];
  }

  ns.apply = { applyPlan, clearFilledFields };
})(globalThis.Autofill );
