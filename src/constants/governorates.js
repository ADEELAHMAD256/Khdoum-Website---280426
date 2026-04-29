export const COUNTRY_KEYS = {
  JORDAN: "Jordan",
  PAKISTAN: "Pakistan",
  UAE: "UAE",
};

export const COUNTRY_BY_DIAL_CODE = {
  "+962": COUNTRY_KEYS.JORDAN,
  "+92": COUNTRY_KEYS.PAKISTAN,
  "+971": COUNTRY_KEYS.UAE,
};

const DIAL_CODES_DESC = Object.keys(COUNTRY_BY_DIAL_CODE).sort(
  (a, b) => b.length - a.length,
);

export const GOVERNORATES_BY_COUNTRY = {
  [COUNTRY_KEYS.JORDAN]: [
    { name: "Amman", center: { lat: 31.963158, lng: 35.930359 } },
    { name: "Irbid", center: { lat: 32.551445, lng: 35.851479 } },
    { name: "Zarqa", center: { lat: 32.07275, lng: 36.08796 } },
  ],
  [COUNTRY_KEYS.PAKISTAN]: [
    { name: "Punjab", center: { lat: 31.4273, lng: 73.1166 } },
    { name: "KPK", center: { lat: 34.0151, lng: 71.5249 } },
    { name: "Sindh", center: { lat: 24.8607, lng: 67.0011 } },
    { name: "Kashmir", center: { lat: 34.37, lng: 73.4708 } },
    { name: "Gilgit", center: { lat: 35.9208, lng: 74.308 } },
  ],
  [COUNTRY_KEYS.UAE]: [
    { name: "Dubai", center: { lat: 25.2048, lng: 55.2708 } },
  ],
};

export const COUNTRY_DEFAULTS = {
  [COUNTRY_KEYS.JORDAN]: {
    center: GOVERNORATES_BY_COUNTRY[COUNTRY_KEYS.JORDAN][0].center,
    minZoom: 12,
  },
  [COUNTRY_KEYS.PAKISTAN]: {
    center: GOVERNORATES_BY_COUNTRY[COUNTRY_KEYS.PAKISTAN][0].center,
    minZoom: 10,
  },
  [COUNTRY_KEYS.UAE]: {
    center: GOVERNORATES_BY_COUNTRY[COUNTRY_KEYS.UAE][0].center,
    minZoom: 12,
  },
};

export function getCountryKeyFromPhoneNumber(phoneNumber, fallback = COUNTRY_KEYS.JORDAN) {
  if (typeof phoneNumber !== "string") return fallback;
  const normalized = phoneNumber.trim().replace(/\s+/g, "");
  if (!normalized) return fallback;

  const dialCode = DIAL_CODES_DESC.find((code) => normalized.startsWith(code));
  return dialCode ? COUNTRY_BY_DIAL_CODE[dialCode] : fallback;
}

export function getGovernoratesForCountry(countryKey, fallback = COUNTRY_KEYS.JORDAN) {
  return (
    GOVERNORATES_BY_COUNTRY[countryKey] ||
    GOVERNORATES_BY_COUNTRY[fallback] ||
    []
  );
}

export function getGovernorateCenter(countryKey, governorateName) {
  const wanted = String(governorateName || "").trim().toLowerCase();
  if (!wanted) return null;

  const list = getGovernoratesForCountry(countryKey);
  const found = list.find((item) => item.name.toLowerCase() === wanted);
  return found?.center || null;
}

export function getCountryDefaults(countryKey, fallback = COUNTRY_KEYS.JORDAN) {
  return COUNTRY_DEFAULTS[countryKey] || COUNTRY_DEFAULTS[fallback];
}

