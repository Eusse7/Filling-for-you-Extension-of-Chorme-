globalThis.Autofill  = globalThis.Autofill  || {};

(function(ns) {
  /**
   * Sistema inteligente de clasificación agnóstico al idioma
   * Combina: atributos HTML estándar, características visuales, validación y contexto
   */

  const FIELD_TYPES = {
    EMAIL: "email",
    PHONE: "tel",
    FULL_NAME: "full-name",
    GIVEN_NAME: "given-name",
    FAMILY_NAME: "family-name",
    ADDRESS: "address-line1",
    CITY: "address-level2",
    COUNTRY: "country-name",
    URL_LINKEDIN: "url-linkedin",
    URL_GITHUB: "url-github",
    KNOWLEDGE_ABOUT: "knowledge-about",
    KNOWLEDGE_STRENGTHS: "knowledge-strengths",
    KNOWLEDGE_SALARY: "knowledge-salary",
    KNOWLEDGE_COVER: "knowledge-cover"
  };

  /**
   * Analiza atributos HTML estándar que indican el tipo de campo
   * sin depender del idioma
   */
  function analyzeHtmlAttributes(field) {
    const scores = {};

    // 1. Atributo "type" de HTML5 (más confiable)
    const type = (field.type || "").toLowerCase();
    if (type === "email") {
      scores[FIELD_TYPES.EMAIL] = (scores[FIELD_TYPES.EMAIL] || 0) + 90;
    } else if (type === "tel") {
      scores[FIELD_TYPES.PHONE] = (scores[FIELD_TYPES.PHONE] || 0) + 90;
    } else if (type === "url") {
      scores[FIELD_TYPES.URL_LINKEDIN] = (scores[FIELD_TYPES.URL_LINKEDIN] || 0) + 20;
      scores[FIELD_TYPES.URL_GITHUB] = (scores[FIELD_TYPES.URL_GITHUB] || 0) + 20;
    }

    // 2. Atributo "inputmode"
    const inputmode = (field.inputmode || "").toLowerCase();
    if (inputmode === "email") {
      scores[FIELD_TYPES.EMAIL] = (scores[FIELD_TYPES.EMAIL] || 0) + 80;
    } else if (inputmode === "tel") {
      scores[FIELD_TYPES.PHONE] = (scores[FIELD_TYPES.PHONE] || 0) + 80;
    } else if (inputmode === "numeric") {
      scores[FIELD_TYPES.KNOWLEDGE_SALARY] = (scores[FIELD_TYPES.KNOWLEDGE_SALARY] || 0) + 40;
    }

    // 3. Atributo "pattern" - patrones comunes
    const pattern = (field.pattern || "").toLowerCase();
    if (pattern.includes("email") || pattern.match(/[a-z0-9._+-]+@[a-z0-9.-]+/)) {
      scores[FIELD_TYPES.EMAIL] = (scores[FIELD_TYPES.EMAIL] || 0) + 70;
    }
    if (pattern.match(/\d{2,}/)) {
      scores[FIELD_TYPES.PHONE] = (scores[FIELD_TYPES.PHONE] || 0) + 50;
    }

    // 4. Atributo "autocomplete" estándar (W3C)
    if (field.autocomplete) {
      const ac = field.autocomplete.toLowerCase().split(/\s+/);
      const lastToken = ac[ac.length - 1];

      const autocompleteMap = {
        "email": FIELD_TYPES.EMAIL,
        "tel": FIELD_TYPES.PHONE,
        "name": FIELD_TYPES.FULL_NAME,
        "given-name": FIELD_TYPES.GIVEN_NAME,
        "family-name": FIELD_TYPES.FAMILY_NAME,
        "street-address": FIELD_TYPES.ADDRESS,
        "address-line1": FIELD_TYPES.ADDRESS,
        "address-level2": FIELD_TYPES.CITY,
        "country-name": FIELD_TYPES.COUNTRY,
        "url": "url"
      };

      if (autocompleteMap[lastToken] === "url") {
        scores[FIELD_TYPES.URL_LINKEDIN] = (scores[FIELD_TYPES.URL_LINKEDIN] || 0) + 30;
        scores[FIELD_TYPES.URL_GITHUB] = (scores[FIELD_TYPES.URL_GITHUB] || 0) + 30;
      } else if (autocompleteMap[lastToken]) {
        scores[autocompleteMap[lastToken]] = (scores[autocompleteMap[lastToken]] || 0) + 95;
      }
    }

    return scores;
  }

  function addScore(scores, type, value) {
    scores[type] = (scores[type] || 0) + value;
  }

  function analyzeFieldWidth(fieldElement, scores) {
    const width = fieldElement?.offsetWidth;
    if (!width) return;

    if (width > 300) {
      addScore(scores, FIELD_TYPES.FULL_NAME, 30);
      addScore(scores, FIELD_TYPES.ADDRESS, 30);
    }

    if (width < 150) {
      addScore(scores, FIELD_TYPES.PHONE, 20);
      addScore(scores, FIELD_TYPES.CITY, 20);
    }
  }

  function analyzeFieldTag(field, scores) {
    if (field.tag === "textarea") {
      // Un textarea sugiere texto largo, pero no define por sí mismo
      // si es "about", "strengths" o "cover".
      addScore(scores, FIELD_TYPES.ADDRESS, 40);
      return;
    }

    if (field.tag === "select") {
      addScore(scores, FIELD_TYPES.COUNTRY, 50);
      addScore(scores, FIELD_TYPES.CITY, 30);
    }
  }

  function analyzeFieldMaxlength(fieldElement, scores) {
    const maxLength = fieldElement?.maxLength;
    if (!maxLength) return;

    if (maxLength <= 5) {
      addScore(scores, FIELD_TYPES.PHONE, 40);
    }

    if (maxLength >= 20) {
      addScore(scores, FIELD_TYPES.ADDRESS, 20);
    }
  }

  /**
   * Analiza características visuales y de contexto del campo
   */
  function analyzeFieldCharacteristics(field, fieldElement) {
    const scores = {};

    analyzeFieldWidth(fieldElement, scores);
    analyzeFieldTag(field, scores);
    analyzeFieldMaxlength(fieldElement, scores);

    if (fieldElement?.readOnly || fieldElement?.disabled) {
      // No es un campo a rellenar
      return {};
    }

    return scores;
  }

  /**
   * Analiza patrones semánticos del name/id/placeholder/label
   * Sin usar keywords, basándose en patrones y estructura
   */
  function analyzeSemanticPatterns(field) {
    const scores = {};
    
    // Combinar todos los textos disponibles
    const texts = [
      field.name,
      field.id,
      field.placeholder,
      field.ariaLabel,
      field.label
    ].filter(Boolean).map(t => String(t).toLowerCase());

    // Patrones universales (sin palabras clave específicas del idioma)
    const patterns = [
      {
        regex: /^(?:email|mail|correo|e-mail|electronic_mail)/i,
        type: FIELD_TYPES.EMAIL,
        weight: 60
      },
      {
        regex: /^(?:phone|tel|telephone|cell|mobile|celular|teléfono|telefono)/i,
        type: FIELD_TYPES.PHONE,
        weight: 60
      },
      {
        regex: /^(?:full.?name|fullname|nombre.?completo|name)/i,
        type: FIELD_TYPES.FULL_NAME,
        weight: 60
      },
      {
        regex: /^(?:first.?name|firstname|given.?name|nombre|givenname)/i,
        type: FIELD_TYPES.GIVEN_NAME,
        weight: 60
      },
      {
        regex: /^(?:last.?name|lastname|family.?name|surname|apellido|familyname)/i,
        type: FIELD_TYPES.FAMILY_NAME,
        weight: 60
      },
      {
        regex: /^(?:address|street|calle|dirección|direccion)/i,
        type: FIELD_TYPES.ADDRESS,
        weight: 60
      },
      {
        regex: /^(?:city|ciudad|town|municipio)/i,
        type: FIELD_TYPES.CITY,
        weight: 60
      },
      {
        regex: /^(?:country|pais|país|nation)/i,
        type: FIELD_TYPES.COUNTRY,
        weight: 60
      },
      {
        regex: /linkedin|linkedin.?url|linkedin.?profile/i,
        type: FIELD_TYPES.URL_LINKEDIN,
        weight: 70
      },
      {
        regex: /github|github.?url|github.?profile/i,
        type: FIELD_TYPES.URL_GITHUB,
        weight: 70
      },
      {
        regex: /(?:^|\b)(about|about_me|sobre\s*ti|sobre\s*mi|cu[eé]ntanos|presentaci[oó]n|perfil)(?:\b|$)/i,
        type: FIELD_TYPES.KNOWLEDGE_ABOUT,
        weight: 80
      },
      {
        regex: /(?:^|\b)(strengths?|fortalezas?|habilidades?|skills?)(?:\b|$)/i,
        type: FIELD_TYPES.KNOWLEDGE_STRENGTHS,
        weight: 90
      },
      {
        regex: /(?:^|\b)(salary|sueldo|salario|compensation|expectativa\s*salarial|pretensi[oó]n\s*salarial)(?:\b|$)/i,
        type: FIELD_TYPES.KNOWLEDGE_SALARY,
        weight: 90
      },
      {
        regex: /(?:^|\b)(cover.?letter|carta|introducci[oó]n|intro|motivation|motivaci[oó]n)(?:\b|$)/i,
        type: FIELD_TYPES.KNOWLEDGE_COVER,
        weight: 90
      }
    ];

    for (const text of texts) {
      for (const pattern of patterns) {
        if (pattern.regex.test(text)) {
          scores[pattern.type] = (scores[pattern.type] || 0) + pattern.weight;
        }
      }
    }

    return scores;
  }

  /**
   * Analiza la posición y contexto del campo en el formulario
   */
  function analyzePositionalContext(field, allFields, fieldIndex) {
    const scores = {};

    const totalFields = allFields.length;
    const positionRatio = fieldIndex / totalFields;

    // Campos de personal info suelen estar al inicio
    if (positionRatio < 0.3) {
      scores[FIELD_TYPES.GIVEN_NAME] = (scores[FIELD_TYPES.GIVEN_NAME] || 0) + 15;
      scores[FIELD_TYPES.FAMILY_NAME] = (scores[FIELD_TYPES.FAMILY_NAME] || 0) + 15;
      scores[FIELD_TYPES.EMAIL] = (scores[FIELD_TYPES.EMAIL] || 0) + 15;
      scores[FIELD_TYPES.PHONE] = (scores[FIELD_TYPES.PHONE] || 0) + 15;
    }

    // Campos de dirección suelen estar en el medio
    if (positionRatio > 0.3 && positionRatio < 0.7) {
      scores[FIELD_TYPES.ADDRESS] = (scores[FIELD_TYPES.ADDRESS] || 0) + 10;
      scores[FIELD_TYPES.CITY] = (scores[FIELD_TYPES.CITY] || 0) + 10;
    }

    // Campos de conocimiento/cover al final
    if (positionRatio > 0.6) {
      scores[FIELD_TYPES.KNOWLEDGE_ABOUT] = (scores[FIELD_TYPES.KNOWLEDGE_ABOUT] || 0) + 20;
      scores[FIELD_TYPES.KNOWLEDGE_COVER] = (scores[FIELD_TYPES.KNOWLEDGE_COVER] || 0) + 20;
    }

    return scores;
  }

  /**
   * Combina todos los scores y retorna el tipo detectado con confianza
   */
  function guessKey(field, fieldElement = null, allFields = null, fieldIndex = 0) {
    const allScores = {};

    // Fusionar scores de diferentes fuentes
    const scoreSources = [
      analyzeHtmlAttributes(field),
      analyzeFieldCharacteristics(field, fieldElement),
      analyzeSemanticPatterns(field),
      ...(allFields ? [analyzePositionalContext(field, allFields, fieldIndex)] : [])
    ];

    for (const scores of scoreSources) {
      for (const [type, score] of Object.entries(scores)) {
        allScores[type] = (allScores[type] || 0) + score;
      }
    }

    // Encontrar el tipo con mayor score
    if (Object.keys(allScores).length === 0) {
      return null;
    }

    const bestType = Object.entries(allScores).reduce((a, b) => 
      b[1] > a[1] ? b : a,
      [null, 0]
    );

    // Solo retornar si hay confianza mínima (50 puntos)
    return bestType[1] >= 50 ? bestType[0] : null;
  }

  ns.classify = { 
    guessKey,
    // Exportar para propósitos de debugging
    analyzeHtmlAttributes,
    analyzeFieldCharacteristics,
    analyzeSemanticPatterns,
    analyzePositionalContext
  };
})(globalThis.Autofill );
