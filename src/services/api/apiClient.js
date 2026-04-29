import { clearAuth, getAuthToken } from "../auth/authStorage";

function isJsonBody(body) {
  if (!body) return false;
  if (body instanceof FormData) return false;
  if (typeof body === "string") return false;
  return typeof body === "object";
}

export async function apiFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  // Default headers (call sites can override).
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (isJsonBody(body)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(url, { ...options, headers, body });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    const message =
      typeof data === "object" && data !== null
        ? data.message || `Request failed (${response.status})`
        : String(data).slice(0, 200) || `Request failed (${response.status})`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
