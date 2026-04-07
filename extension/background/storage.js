export const storage = {
  async get(key, defaults = {}) {
    return chrome.storage.local.get(Object.assign({}, defaults, key ? { [key]: undefined } : {}));
  },
  async set(obj) {
    return chrome.storage.local.set(obj);
  }
};

export async function getToken() {
  const { token } = await chrome.storage.local.get({ token: "" });
  return token || "";
}

export async function setToken(token) {
  await chrome.storage.local.set({ token: token || "" });
}
