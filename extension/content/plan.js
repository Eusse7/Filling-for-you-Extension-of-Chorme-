globalThis.Autofill = globalThis.Autofill || {};

(function(ns) {
  function buildValueMap(profile, knowledge) {
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();

    return {
      "full-name": fullName,
      "name": fullName,
      "email": profile.email,
      "tel": profile.phone,
      "tel-national": profile.phone,
      "given-name": profile.firstName,
      "family-name": profile.lastName,
      "street-address": profile.addressLine1,
      "address-line1": profile.addressLine1,
      "address-level2": profile.city,
      "country": profile.country,
      "country-name": profile.country,
      "url-linkedin": profile.linkedin,
      "url-github": profile.github,
      "knowledge-about": knowledge.about_me,
      "knowledge-strengths": knowledge.strengths,
      "knowledge-salary": knowledge.salary_expectation,
      "knowledge-cover": knowledge.cover_letter
    };
  }

  function buildPlan(fields, profile, knowledge, guessKeyFn, fieldElements = null) {
    const map = buildValueMap(profile, knowledge);
    return fields.map((f, index) => {
      // Pasar contexto adicional a guessKeyFn para mejor clasificación
      const fieldElement = fieldElements ? fieldElements[index] : null;
      const key = guessKeyFn(f, fieldElement, fields, index);
      const value = key ? map[key] : null;
      return value ? { field: f, key, value } : null;
    }).filter(Boolean);
  }

  ns.plan = { buildPlan };
})(globalThis.Autofill);
