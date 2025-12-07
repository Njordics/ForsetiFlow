// Shared API helper
window.api = async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || res.statusText);
  }
  if (!text) return null; // tolerate empty/204 responses to avoid JSON parse errors
  try {
    return JSON.parse(text);
  } catch (_err) {
    return text;
  }
};
