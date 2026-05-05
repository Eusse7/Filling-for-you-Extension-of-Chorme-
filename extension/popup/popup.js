const DEFAULT_PROFILE_URL = "http://localhost:5173/";
const THEME_KEY = "ffy_theme";
const themeToggle = document.getElementById("toggleTheme");

function applyTheme(theme) {
  const useDark = theme === "dark";
  document.body.classList.toggle("dark", useDark);
  themeToggle.checked = useDark;
  themeToggle.setAttribute("aria-label", useDark ? "Modo claro" : "Modo oscuro");
}

chrome.storage.sync.get(THEME_KEY, (result) => {
  applyTheme(result[THEME_KEY] || "light");
});

themeToggle.addEventListener("change", () => {
  const next = themeToggle.checked ? "dark" : "light";
  chrome.storage.sync.set({ [THEME_KEY]: next }, () => {
    applyTheme(next);
  });
});

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContent(tabId, msg) {
  return chrome.tabs.sendMessage(tabId, msg);
}

function resolveWebUrl(tab) {
  let targetUrl = DEFAULT_PROFILE_URL;

  try {
    const tabUrl = new URL(tab.url || "");
    const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
    if (allowedOrigins.includes(tabUrl.origin)) {
      targetUrl = `${tabUrl.origin}/`;
    }
  } catch {
    // Si no se puede parsear la URL activa, usa el origen por defecto.
  }

  return targetUrl;
}

document.getElementById("openProfile").onclick = async () => {
  const tab = await getActiveTab();
  const targetUrl = resolveWebUrl(tab);

  await chrome.tabs.create({ url: targetUrl });
};

document.getElementById("fill").onclick = async () => {
  const tab = await getActiveTab();
  const targetUrl = resolveWebUrl(tab);
  try {
    const stored = await chrome.runtime.sendMessage({ type: "GET_TOKEN" });
    if (!stored?.token) {
      await chrome.tabs.create({ url: targetUrl });
      return;
    }

    const result = await sendToContent(tab.id, { type: "PREVIEW_AND_FILL", safeMode: true });
    if (result && !result.ok && /no autenticado/i.test(result.error || "")) {
      await chrome.tabs.create({ url: targetUrl });
    }
  } catch (e) {
    console.error("No pude llenar. Abre http://localhost:5173 y vuelve a intentar.", e);
  }
};
