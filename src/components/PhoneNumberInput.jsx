import React, { useState } from "react";

// Country data (minimal)
const COUNTRIES = [
  { name: "Jordan", dialCode: "+962", flag: "🇯🇴", hint: "79*******" },
  { name: "Pakistan", dialCode: "+92", flag: "🇵🇰", hint: "3*********" },
  { name: "UAE", dialCode: "+971", flag: "🇦🇪", hint: "50*******" },
];

export default function PhoneNumberInputWithCountry({
  value,
  dialCode,
  onChange,
  containerStyle,
  compact = false,
}) {
  const isCompact = Boolean(compact);
  const [internalDialCode, setInternalDialCode] = useState(() => {
    if (typeof dialCode === "string" && dialCode.trim()) return dialCode.trim();
    return COUNTRIES[0].dialCode;
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const effectiveDialCode =
    typeof dialCode === "string" && dialCode.trim()
      ? dialCode.trim()
      : internalDialCode;
  const selectedCountry =
    COUNTRIES.find((country) => country.dialCode === effectiveDialCode) ||
    COUNTRIES[0];

  const handleCountryChange = (country) => {
    setDropdownOpen(false);
    onChange({ phone: value, dialCode: country.dialCode });
    if (dialCode == null) {
      setInternalDialCode(country.dialCode);
    }
  };

  const handleInputChange = (e) => {
    onChange({ phone: e.target.value, dialCode: selectedCountry.dialCode });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: isCompact ? "1px solid #d9d9d9" : "1px solid #ccc",
        borderRadius: isCompact ? 12 : 15,
        padding: isCompact ? "8px 12px" : "12px 14px",
        backgroundColor: "#fff",
        width: "100%",
        maxWidth: 460,
        position: "relative",
        ...containerStyle,
      }}
    >
      {/* Country picker trigger */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          marginRight: isCompact ? 8 : 10,
          borderRadius: 10,
        }}
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <span
          style={{
            fontSize: isCompact ? 20 : 24,
            lineHeight: isCompact ? 1 : undefined,
          }}
        >
          {selectedCountry.flag}
        </span>
        <span
          style={{
            marginLeft: 8,
            color: "#555",
            ...(isCompact ? { fontSize: 13, lineHeight: 1 } : {}),
          }}
        >
          {selectedCountry.dialCode}
        </span>
      </div>

      {/* Vertical divider */}
      <div
        style={{
          height: isCompact ? "20px" : "24px",
          width: "1px",
          backgroundColor: "#ccc",
          marginRight: isCompact ? 8 : 10,
        }}
      />

      {/* Phone input */}
      <input
        type="tel"
        placeholder={selectedCountry.hint}
        value={value}
        onChange={handleInputChange}
        style={{
          flex: 1,
          fontSize: isCompact ? 13 : 16,
          lineHeight: isCompact ? "25px" : undefined,
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          color: "black",
        }}
      />

      {/* Country dropdown */}
      {dropdownOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: 16,
            marginTop: 5,
            zIndex: 2000,
            overflow: "hidden",
          }}
        >
          {COUNTRIES.map((country) => (
            <div
              key={country.dialCode}
              onClick={() => handleCountryChange(country)}
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                backgroundColor:
                  selectedCountry.dialCode === country.dialCode
                    ? "#f0f0f0"
                    : "white",
              }}
            >
              <span style={{ fontSize: 29, marginRight: 10 }}>
                {country.flag}
              </span>
              <span style={{ marginLeft: 10, color: "#777" }}>
                {country.name}
              </span>
              <span style={{ marginLeft: "auto", color: "#777" }}>
                {country.dialCode}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
