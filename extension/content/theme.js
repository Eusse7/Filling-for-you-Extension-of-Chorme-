(function () {
  const THEME_KEY = "ffy_theme";
  const allowedOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);

  if (!allowedOrigins.has(window.location.origin)) {
    return;
  }

  function applyTheme(value) {
    const useDark = value === "dark";
    document.documentElement.classList.toggle("ffy-dark", useDark);
  }

  chrome.storage.sync.get(THEME_KEY, (result) => {
    applyTheme(result[THEME_KEY] || "light");
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (!changes[THEME_KEY]) return;
    applyTheme(changes[THEME_KEY].newValue || "light");
  });
})();
