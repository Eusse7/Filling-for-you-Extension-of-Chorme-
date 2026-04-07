import { apiClient } from "./apiClient.js";
import { addLocalLog, getLocalLogs } from "./logStore.js";
import { getToken, setToken } from "./storage.js";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        case "GET_PROFILE":
          sendResponse(await apiClient.get("/profile"));
          return;
        case "GET_KNOWLEDGE":
          sendResponse(await apiClient.get("/knowledge"));
          return;
        case "LOG_ACTION": {
          // Guarda bitácora local y también envía al backend
          await addLocalLog(msg.payload);
          await apiClient.post("/logs", msg.payload);
          sendResponse({ ok: true });
          return;
        }
        case "GET_LOCAL_LOGS":
          sendResponse({ ok: true, data: await getLocalLogs() });
          return;
        case "SET_TOKEN":
          await setToken(msg.token || "");
          sendResponse({ ok: true, token: await getToken() });
          return;
        default:
          sendResponse({ ok: false, error: "Unknown message type" });
          return;
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();

  return true;
});
