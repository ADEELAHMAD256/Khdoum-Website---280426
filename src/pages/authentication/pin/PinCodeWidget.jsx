import React, { useEffect, useRef } from "react";
import "./PinCodeWidget.css";
import imagePath from "../../../assets/icons/pin.png";

export default function PinCodeWidget({
  title = "PIN",
  hintText,
  pinLength,
  pinDigits,
  onClear,
  onComplete,
  onNext,
}) {
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, pinLength);
    console.log("⌨️ [PinCodeWidget] PIN input changed:", val);
    onComplete(val);
  };

  const renderBoxes = () => {
    return Array.from({ length: pinLength }).map((_, i) => {
      const digit = pinDigits[i] || "";
      const hasValue = digit !== "";
      return (
        <div
          className={`pin-box ${hasValue ? "filled" : ""}`}
          key={i}
          onClick={() => hiddenInputRef.current?.focus()}
        >
          {hasValue ? digit : ""}
        </div>
      );
    });
  };

  return (
    <div className="pin-widget-wrapper">
      <div className="pin-widget-container">
        <div className="pin-image-section">
          {imagePath && (
            <img src={imagePath} alt="pin hint" className="pin-image" />
          )}
        </div>
        <div className="pin-content-section">
          <div className="pin-content-wrapper">
            <h2>{title}</h2>
            {hintText && <p className="pin-hint">{hintText}</p>}
            <div className="pin-boxes">{renderBoxes()}</div>
            <button className="clear-btn" onClick={onClear}>
              Clear
            </button>
            <button
              className="next-btn"
              onClick={() => {
                console.log("🟢 [PinCodeWidget] Next clicked");
                onNext(); // ✅ FIXED — now calls parent logic
              }}
            >
              Next
            </button>
          </div>
        </div>

        <input
          ref={hiddenInputRef}
          type="text"
          className="hidden-input"
          value={pinDigits.join("")}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
