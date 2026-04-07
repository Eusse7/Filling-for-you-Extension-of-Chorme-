const out = document.getElementById("out");
const DEFAULT_PROFILE_URL = "http://localhost:5173/";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContent(tabId, msg) {
  return chrome.tabs.sendMessage(tabId, msg);
}

document.getElementById("openProfile").onclick = async () => {
  const tab = await getActiveTab();
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

  await chrome.tabs.create({ url: targetUrl });
};

document.getElementById("fill").onclick = async () => {
  const tab = await getActiveTab();
  try {
    const resp = await sendToContent(tab.id, { type: "PREVIEW_AND_FILL", safeMode: true });
    out.textContent = JSON.stringify(resp, null, 2);
  } catch (e) {
     out.textContent = "No pude llenar. Abre http://localhost:5173 y vuelve a intentar.\n" + String(e);
  }
};
