// components/shared/CustomText.jsx

import React from "react";
import "./CustomText.css";

export default function CustomText({
  children,
  color = "#000",
  size = "14px",
  weight = "400",
  style = {},
  className = "",
}) {
  return (
    <span
      className={`custom-text ${className}`}
      style={{ color, fontSize: size, fontWeight: weight, ...style }}
    >
      {children}
    </span>
  );
}
