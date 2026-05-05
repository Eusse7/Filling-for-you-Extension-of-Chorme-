globalThis.Autofill  = globalThis.Autofill  || {};

(function(ns) {
  // Almacenar referencias a los elementos actuales para acceso posterior
  let cachedElements = [];

  function textOf(el) {
    return el && (el.innerText || el.textContent) ? (el.innerText || el.textContent).trim() : "";
  }

  function getFieldLabel(el) {
    const id = el.getAttribute("id");
    if (id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      const t = textOf(lbl);
      if (t) return t;
    }
    const parentLabel = el.closest("label");
    const t2 = textOf(parentLabel);
    if (t2) return t2;
    return "";
  }

  function selectorHint(el) {
    const name = el.getAttribute("name") || "";
    const id = el.getAttribute("id") || "";
    if (name) return `[name="${CSS.escape(name)}"]`;
    if (id) return `#${CSS.escape(id)}`;
    return null;
  }

  function describeField(el) {
    return {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || "",
      name: el.getAttribute("name") || "",
      id: el.getAttribute("id") || "",
      autocomplete: el.getAttribute("autocomplete") || "",
      ariaLabel: el.getAttribute("aria-label") || "",
      placeholder: el.getAttribute("placeholder") || "",
      label: getFieldLabel(el),
      selectorHint: selectorHint(el),
      // Nuevos atributos para mejor clasificación
      inputmode: el.getAttribute("inputmode") || "",
      pattern: el.getAttribute("pattern") || "",
      maxlength: el.getAttribute("maxlength") || "",
      required: el.hasAttribute("required"),
      readonly: el.readOnly || false,
      disabled: el.disabled || false,
      ariaRequired: el.getAttribute("aria-required") || "",
      title: el.getAttribute("title") || ""
    };
  }

  function scanFormFields(root = document) {
    const els = Array.from(root.querySelectorAll("input, textarea, select"))
      .filter(el => !el.disabled && el.type !== "hidden");
    
    // Guardar referencias a los elementos para acceso posterior
    cachedElements = els;
    
    return els.map(describeField);
  }

  /**
   * Retorna el elemento DOM en el índice especificado
   * Usado por la función de clasificación para análisis visual
   */
  function getElementAt(index) {
    return cachedElements[index] || null;
  }

  /**
   * Retorna todos los elementos cached
   */
  function getCachedElements() {
    return [...cachedElements];
  }

  ns.scan = { 
    scanFormFields,
    getElementAt,
    getCachedElements
  };
})(globalThis.Autofill );
