const out = document.getElementById("out");
const PROFILE_URL = "http://localhost:5173/";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToContent(tabId, msg) {
  return chrome.tabs.sendMessage(tabId, msg);
}

document.getElementById("openProfile").onclick = async () => {
  await chrome.tabs.create({ url: PROFILE_URL });
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
