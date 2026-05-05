/**
 * Herramienta de Debug para Sistema de Clasificación de Campos
 * 
 * Uso en la consola del navegador:
 * 1. copy(FieldClassificationDebugger.generateReport())
 * 2. Pega en archivo para análisis
 */

globalThis.FieldClassificationDebugger = {
  /**
   * Genera un reporte detallado de la clasificación actual
   */
  generateReport() {
    if (!globalThis.Autofill?.scan) {
      return { error: "Autofill extension not loaded" };
    }

    const fields = globalThis.Autofill.scan.scanFormFields();
    const elements = globalThis.Autofill.scan.getCachedElements();

    return fields.map((field, index) => {
      const element = elements[index];
      const htmlAttrs = globalThis.Autofill.classify.analyzeHtmlAttributes(field);
      const visual = globalThis.Autofill.classify.analyzeFieldCharacteristics(field, element);
      const semantic = globalThis.Autofill.classify.analyzeSemanticPatterns(field);
      const positional = globalThis.Autofill.classify.analyzePositionalContext(field, fields, index);

      // Combinar scores
      const allScores = {};
      [htmlAttrs, visual, semantic, positional].forEach(scores => {
        Object.entries(scores).forEach(([type, score]) => {
          allScores[type] = (allScores[type] || 0) + score;
        });
      });

      const bestMatch = Object.entries(allScores).sort((a, b) => b[1] - a[1])[0];
      const detected = bestMatch && bestMatch[1] >= 50 ? bestMatch[0] : null;

      return {
        index,
        field: {
          name: field.name,
          id: field.id,
          type: field.type,
          tag: field.tag,
          placeholder: field.placeholder,
          label: field.label,
          autocomplete: field.autocomplete
        },
        scores: {
          htmlAttributes: htmlAttrs,
          visual,
          semantic,
          positional,
          combined: allScores,
          topMatch: bestMatch ? { type: bestMatch[0], score: bestMatch[1] } : null
        },
        detected,
        confidence: bestMatch ? Math.min(100, (bestMatch[1] / 95) * 100) : 0
      };
    });
  },

  /**
   * Imprime un reporte formateado en la consola
   */
  printReport() {
    const report = this.generateReport();

    if (report.error) {
      console.error(report.error);
      return;
    }

    console.group("🔍 Field Classification Report");
    report.forEach((item, idx) => {
      const confidence = item.confidence.toFixed(1);
      const status = item.detected ? "✅" : "⚠️";

      console.group(
        `${status} Field ${item.index}: ${item.field.name || item.field.id || "unnamed"} → ${item.detected || "NOT DETECTED"} (${confidence}% confidence)`
      );

      console.table({
        "Type": item.field.type,
        "Tag": item.field.tag,
        "Name": item.field.name,
        "ID": item.field.id,
        "Placeholder": item.field.placeholder,
        "Label": item.field.label,
        "Autocomplete": item.field.autocomplete
      });

      console.log("📊 Score Breakdown:");
      console.table({
        "HTML Attributes": Object.values(item.scores.htmlAttributes).reduce((a, b) => a + b, 0),
        "Visual Analysis": Object.values(item.scores.visual).reduce((a, b) => a + b, 0),
        "Semantic Patterns": Object.values(item.scores.semantic).reduce((a, b) => a + b, 0),
        "Positional Context": Object.values(item.scores.positional).reduce((a, b) => a + b, 0),
        "TOTAL": item.scores.topMatch?.score || 0
      });

      if (Object.keys(item.scores.htmlAttributes).length > 0) {
        console.log("  HTML Attributes:", item.scores.htmlAttributes);
      }
      if (Object.keys(item.scores.visual).length > 0) {
        console.log("  Visual Analysis:", item.scores.visual);
      }
      if (Object.keys(item.scores.semantic).length > 0) {
        console.log("  Semantic Patterns:", item.scores.semantic);
      }
      if (Object.keys(item.scores.positional).length > 0) {
        console.log("  Positional Context:", item.scores.positional);
      }

      console.groupEnd();
    });
    console.groupEnd();

    // Resumen
    const totalFields = report.length;
    const detectedFields = report.filter(r => r.detected).length;
    const avgConfidence = (report.reduce((sum, r) => sum + r.confidence, 0) / totalFields).toFixed(1);

    console.group("📈 Summary");
    console.table({
      "Total Fields": totalFields,
      "Detected": detectedFields,
      "Detection Rate": `${((detectedFields / totalFields) * 100).toFixed(1)}%`,
      "Average Confidence": `${avgConfidence}%`
    });
    console.groupEnd();
  },

  /**
   * Analiza un campo específico en detalle
   */
  analyzeField(nameOrIdOrSelector) {
    const el = document.querySelector(
      nameOrIdOrSelector.startsWith("[") 
        ? nameOrIdOrSelector 
        : `[name="${nameOrIdOrSelector}"], #${nameOrIdOrSelector}`
    );

    if (!el) {
      console.error(`Field not found: ${nameOrIdOrSelector}`);
      return;
    }

    // Recrear la descripción del campo
    const field = {
      tag: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || "",
      name: el.getAttribute("name") || "",
      id: el.getAttribute("id") || "",
      autocomplete: el.getAttribute("autocomplete") || "",
      ariaLabel: el.getAttribute("aria-label") || "",
      placeholder: el.getAttribute("placeholder") || "",
      label: el.closest("label")?.textContent || "",
      inputmode: el.getAttribute("inputmode") || "",
      pattern: el.getAttribute("pattern") || "",
      maxlength: el.getAttribute("maxlength") || "",
      required: el.hasAttribute("required"),
      readonly: el.readOnly || false,
      disabled: el.disabled || false,
      ariaRequired: el.getAttribute("aria-required") || "",
      title: el.getAttribute("title") || ""
    };

    const htmlAttrs = globalThis.Autofill.classify.analyzeHtmlAttributes(field);
    const visual = globalThis.Autofill.classify.analyzeFieldCharacteristics(field, el);
    const semantic = globalThis.Autofill.classify.analyzeSemanticPatterns(field);
    const positional = globalThis.Autofill.classify.analyzePositionalContext(
      field,
      globalThis.Autofill.scan.scanFormFields(),
      Array.from(document.querySelectorAll("input, textarea, select")).indexOf(el)
    );

    const allScores = {};
    [htmlAttrs, visual, semantic, positional].forEach(scores => {
      Object.entries(scores).forEach(([type, score]) => {
        allScores[type] = (allScores[type] || 0) + score;
      });
    });

    const sorted = Object.entries(allScores).sort((a, b) => b[1] - a[1]);

    console.group(`🔎 Detailed Analysis: ${field.name || field.id}`);
    console.table(field);
    console.log("📊 Scores by Layer:");
    console.log("  HTML Attributes:", htmlAttrs);
    console.log("  Visual Analysis:", visual);
    console.log("  Semantic Patterns:", semantic);
    console.log("  Positional Context:", positional);
    console.log("\n🎯 Combined Scores (sorted):");
    sorted.forEach(([type, score]) => {
      const confidence = Math.min(100, (score / 95) * 100).toFixed(1);
      const bar = "█".repeat(Math.ceil(score / 5)) + "░".repeat(Math.ceil((100 - score) / 5));
      console.log(`  ${type.padEnd(20)} ${score.toString().padStart(3)} pts [${bar}] ${confidence}%`);
    });
    console.groupEnd();
  },

  /**
   * Exporta datos para análisis JSON
   */
  exportJSON() {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  },

  /**
   * Exporta datos para CSV
   */
  exportCSV() {
    const report = this.generateReport();
    const headers = ["Index", "Name/ID", "Type", "Detected", "Confidence", "HTML Score", "Visual Score", "Semantic Score", "Positional Score"];
    
    const rows = report.map(item => {
      const htmlScore = Object.values(item.scores.htmlAttributes).reduce((a, b) => a + b, 0);
      const visualScore = Object.values(item.scores.visual).reduce((a, b) => a + b, 0);
      const semanticScore = Object.values(item.scores.semantic).reduce((a, b) => a + b, 0);
      const positionalScore = Object.values(item.scores.positional).reduce((a, b) => a + b, 0);

      return [
        item.index,
        item.field.name || item.field.id || "unnamed",
        item.field.type,
        item.detected || "N/A",
        item.confidence.toFixed(1),
        htmlScore,
        visualScore,
        semanticScore,
        positionalScore
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return csv;
  },

  /**
   * Descarga el reporte como archivo
   */
  downloadReport(format = "json") {
    let content, filename, type;

    switch (format.toLowerCase()) {
      case "csv":
        content = this.exportCSV();
        filename = "field-classification-report.csv";
        type = "text/csv";
        break;
      case "json":
      default:
        content = this.exportJSON();
        filename = "field-classification-report.json";
        type = "application/json";
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// Alias para comodidad
globalThis.FFYDebug = globalThis.FieldClassificationDebugger;

console.log("✅ Field Classification Debugger loaded");
console.log("📖 Usage: FieldClassificationDebugger.printReport() or FFYDebug.printReport()");
