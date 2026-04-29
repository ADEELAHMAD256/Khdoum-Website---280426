import React, { useState } from "react";
import "./addShipment.css";
import CustomCheckBox from "../../components/CustomCheckBox";
import boxIcon from "../../assets/images/a.svg";
import MapPicker from "./AddAddress.jsx";
import SavedAddresses from "./SavedAddresses";
import BulkShipmentInstructions from "./BulkShipmentInstructions"; // ✅ New component
import { getAuthPhoneNumber } from "../../services/auth/authStorage";
import {
  getCountryKeyFromPhoneNumber,
  getGovernoratesForCountry,
} from "../../constants/governorates";

export default function AddShipment() {
  const [activeTab, setActiveTab] = useState("piece");

  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [pickupGovernorate, setPickupGovernorate] = useState("");
  const [dropoffGovernorate, setDropoffGovernorate] = useState("");

  const [pickupAddressType, setPickupAddressType] = useState("manual");
  const [dropoffAddressType, setDropoffAddressType] = useState("manual");

  const [confirmSize, setConfirmSize] = useState(false);
  const [fragile, setFragile] = useState(false);
  const [otherAmount, setOtherAmount] = useState(false);
  const [amount, setAmount] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [shippingPayer, setShippingPayer] = useState("me");

  const countryKey = getCountryKeyFromPhoneNumber(getAuthPhoneNumber());
  const governorates = getGovernoratesForCountry(countryKey);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Collect and process form data here
  };

  const renderManualSection = (
    date,
    setDate,
    governorate,
    setGovernorate,
    _mapText,
    _buttonText,
    setLocation,
    label,
    location,
  ) => (
    <>
      <div className="form-row pickup-inline-row">
        <label className="form-label pickup-label">
          Date & Time
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="form-input"
            required
          />
        </label>

        <div className="button-row pickup-inline-buttons">
          <button
            type="button"
            className="option-button"
            onClick={() => setDate(new Date().toISOString().slice(0, 16))}
          >
            Today
          </button>
          <button
            type="button"
            className="option-button"
            onClick={() =>
              setDate(
                new Date(Date.now() + 86400000).toISOString().slice(0, 16),
              )
            }
          >
            Tomorrow
          </button>
        </div>
      </div>

      <div className="form-row governorate-row">
        <label className="form-label">Governorate</label>
        <div className="button-row">
          {governorates.map((g) => (
            <button
              key={g.name}
              type="button"
              className={`option-button ${String(governorate || "").toLowerCase() ===
                  g.name.toLowerCase()
                  ? "selected"
                  : ""
                }`}
              onClick={() => setGovernorate(g.name)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div className="map-section">
        <div className="map-placeholder">
          <MapPicker
            location={location}
            setLocation={setLocation}
            governorate={governorate}
            countryKey={countryKey}
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="shipment-wrapper">
      <h2 className="shipment-title">Add New Shipment</h2>

      <div className="shipment-tabs">
        <button
          className={`tab-button ${activeTab === "piece" ? "active" : ""}`}
          onClick={() => setActiveTab("piece")}
        >
          Ship by Piece
        </button>
        <button
          className={`tab-button ${activeTab === "bulk" ? "active" : ""}`}
          onClick={() => setActiveTab("bulk")}
        >
          Bulk Shipments
        </button>
      </div>

      {activeTab === "piece" ? (
        <form className="shipment-form" onSubmit={handleSubmit}>
          <h3 className="section-heading">Shipment Details</h3>
          <div className="form-row">
            <label className="form-label">
              Shipment Value (JD)
              <input type="text" className="form-input" required />
            </label>

            <label className="form-label dimensions-label">
              Shipment Dimensions
              <div
                className="dimensions-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <img
                  src={boxIcon}
                  alt="Box"
                  style={{ width: "290px", height: "100px" }}
                />
                <CustomCheckBox
                  value={confirmSize}
                  onChange={(e) => setConfirmSize(e.target.checked)}
                  label={
                    <>
                      I confirm that the shipment size is within the previous
                      shipments and{" "}
                      <span className="highlight-text">
                        does not exceed the specified limit
                      </span>
                    </>
                  }
                />
                <CustomCheckBox
                  value={fragile}
                  onChange={(e) => setFragile(e.target.checked)}
                  label={
                    <>
                      The shipment has{" "}
                      <span className="highlight-text">fragile content</span>
                    </>
                  }
                />
              </div>
            </label>
          </div>

          <div className="pickup-dropoff-grid">
            <div className="address-column">
              <h3 className="section-heading">Pickup Details</h3>

              <div className="address-tabs">
                <button
                  className={`address-tab ${pickupAddressType === "manual" ? "active" : ""
                    }`}
                  onClick={() => setPickupAddressType("manual")}
                  type="button"
                >
                  Manual
                </button>
                <button
                  className={`address-tab ${pickupAddressType === "saved" ? "active" : ""
                    }`}
                  onClick={() => setPickupAddressType("saved")}
                  type="button"
                >
                  Saved
                </button>
              </div>

              {pickupAddressType === "manual" ? (
                renderManualSection(
                  pickupDate,
                  setPickupDate,
                  pickupGovernorate,
                  setPickupGovernorate,
                  "Pickup Location",
                  "Set Pickup Location",
                  setPickupLocation,
                  "Pickup Map",
                  pickupLocation,
                )
              ) : (
                <SavedAddresses />
              )}
            </div>

            <div className="address-column">
              <h3 className="section-heading">Drop‑Off Details</h3>

              <div className="address-tabs">
                <button
                  className={`address-tab ${dropoffAddressType === "manual" ? "active" : ""
                    }`}
                  onClick={() => setDropoffAddressType("manual")}
                  type="button"
                >
                  Manual
                </button>
                <button
                  className={`address-tab ${dropoffAddressType === "saved" ? "active" : ""
                    }`}
                  onClick={() => setDropoffAddressType("saved")}
                  type="button"
                >
                  Saved
                </button>
              </div>

              {dropoffAddressType === "manual" ? (
                renderManualSection(
                  dropoffDate,
                  setDropoffDate,
                  dropoffGovernorate,
                  setDropoffGovernorate,
                  "Drop‑Off Location",
                  "Set Drop‑Off Location",
                  setDropoffLocation,
                  "Drop‑Off Map",
                  dropoffLocation,
                )
              ) : (
                <SavedAddresses />
              )}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">
              Recipient Name
              <input
                type="text"
                name="recipientName"
                className="form-input"
                required
              />
            </label>
            <label className="form-label">
              Recipient Mobile
              <input
                type="tel"
                name="recipientMobile"
                className="form-input"
                required
              />
            </label>
          </div>

          <div className="pickup-dropoff-grid">
            <div className="address-column">
              <h3 className="section-heading">
                Are there any other amounts for your recipient to pay upon
                delivery?
              </h3>

              <div className="address-tabs">
                <button
                  type="button"
                  className={`address-tab ${otherAmount ? "active" : ""}`}
                  onClick={() => setOtherAmount(true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`address-tab ${!otherAmount ? "active" : ""}`}
                  onClick={() => {
                    setOtherAmount(false);
                    setAmount("");
                  }}
                >
                  No
                </button>
              </div>

              {otherAmount && (
                <div className="form-row">
                  <label className="form-label">
                    How much is the amount? (In JOD)
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="form-input"
                      placeholder="0.0 JOD"
                      required
                    />
                  </label>
                  <p className="helper-text">
                    Payments that your recipient pays by card are subjected to
                    the service provider fees JD 0.20 + 2.9%
                  </p>
                </div>
              )}
            </div>

            <div className="address-column">
              <h3 className="section-heading">
                Who is paying the shipping fees?
              </h3>

              <div className="address-tabs">
                <button
                  type="button"
                  className={`address-tab ${shippingPayer === "me" ? "active" : ""
                    }`}
                  onClick={() => setShippingPayer("me")}
                >
                  Me
                </button>
                <button
                  type="button"
                  className={`address-tab ${shippingPayer === "recipient" ? "active" : ""
                    }`}
                  onClick={() => setShippingPayer("recipient")}
                >
                  Recipient
                </button>
              </div>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: "16px" }}>
            <label
              className="form-label"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                required
                style={{ width: "18px", height: "18px" }}
              />
              <span>
                I accept all the{" "}
                <span className="highlight-text">terms and conditions</span> of
                using the services
              </span>
            </label>
          </div>

          <div className="form-footer">
            <button type="submit" className="submit-button">
              Next
            </button>
          </div>
        </form>
      ) : (
        <BulkShipmentInstructions />
      )}
    </div>
  );
}
