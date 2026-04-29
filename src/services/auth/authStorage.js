const AUTH_STORAGE_KEY = "khdoum_seller_auth";
export const AUTH_CHANGE_EVENT = "khdoum-auth-change";

function emitAuthChange() {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  } catch {
    // ignore
  }
}

function safeLocalStorageGet(key) {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (private mode, quota, disabled, etc.)
  }
}

function safeLocalStorageRemove(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function decodeJwtPayload(token) {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token, leewaySeconds = 30) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (!exp) return false; // If no exp claim, we can't validate it client-side.
  return exp * 1000 <= Date.now() + leewaySeconds * 1000;
}

export function getStoredAuth() {
  const raw = safeLocalStorageGet(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  const auth = getStoredAuth();
  const token = auth?.token;
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearAuth();
    return null;
  }

  return token;
}

export function getAuthPayload() {
  const token = getAuthToken();
  if (!token) return null;
  return decodeJwtPayload(token);
}

export function getAuthUserId() {
  const payload = getAuthPayload();
  return payload?.userId || payload?.userID || payload?.sub || payload?.id || null;
}

export function getAuthPhoneNumber() {
  const token = getAuthToken();
  if (!token) return null;

  const stored = getStoredAuth();
  const storedPhone =
    typeof stored?.phoneNumber === "string" && stored.phoneNumber.trim()
      ? stored.phoneNumber.trim()
      : null;
  if (storedPhone) return storedPhone;

  const payload = decodeJwtPayload(token);
  const payloadPhone =
    payload?.phone ||
    payload?.phoneNumber ||
    payload?.phone_number ||
    payload?.mobile ||
    payload?.msisdn ||
    null;
  if (typeof payloadPhone === "string" && payloadPhone.trim()) {
    return payloadPhone.trim();
  }

  return null;
}

export function saveAuth({ token, employee, phoneNumber } = {}) {
  if (!token) return;
  const auth = {
    token,
    employee: Boolean(employee),
    savedAt: Date.now(),
    ...(typeof phoneNumber === "string" && phoneNumber.trim()
      ? { phoneNumber: phoneNumber.trim() }
      : {}),
  };
  safeLocalStorageSet(AUTH_STORAGE_KEY, JSON.stringify(auth));
  emitAuthChange();
}

export function clearAuth() {
  safeLocalStorageRemove(AUTH_STORAGE_KEY);
  emitAuthChange();
}
