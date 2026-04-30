import { useState } from "react";
import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import { useToast } from "../../components/Toast/useToast";

export default function NewShipmentPickup({
  onBack,
  onNext,
  governorates: governorateOptions = [],
  onGovernorateSelect,
  pickupDateTime = "",
  onPickupDateTimeChange,
  governorate = "",
  onGovernorateChange,
  instructions = "",
  onInstructionsChange,
  pickupLocation,
  savedAddresses = [],
  savedAddressesLoading = false,
  savedAddressesError = "",
  onSavedAddressesOpen,
  onSavedAddressesRetry,
  selectedSavedAddress,
  onSelectSavedAddress,
  isMobileMapFullscreen,
  onSetLocationClick,
}) {
  const [addressMode, setAddressMode] = useState("manual");

  const toast = useToast();

  const availableGovernorates =
    Array.isArray(governorateOptions) && governorateOptions.length > 0
      ? governorateOptions
      : [{ name: "Irbid" }, { name: "Zarqa" }, { name: "Amman" }];

  const hasPickupLocation =
    pickupLocation &&
    typeof pickupLocation.lat === "number" &&
    typeof pickupLocation.lng === "number";
  const selectedSavedAddressId = selectedSavedAddress?.id;
  const shouldShowQuickButtons = !String(pickupDateTime || "").trim();

  const handleNext = () => {
    if (!pickupDateTime) {
      toast.warning("Please choose pickup date & time.");
      return;
    }

    if (addressMode === "manual") {
      if (!governorate) {
        toast.warning("Please select pickup governorate.");
        return;
      }
    } else if (!selectedSavedAddressId) {
      toast.warning("Please select a saved address.");
      return;
    }

    if (!hasPickupLocation) {
      toast.warning("Please select the pick-up location on the map.");
      return;
    }

    onNext?.();
  };

  if (isMobileMapFullscreen) {
    return null;
  }

  return (
    <div className="pickup-details-overlay">
      <div className="pickup-details-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back to new shipment"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <CustomText size="16px" weight="700">
          Pick-Up Details
        </CustomText>
      </div>

      <div className="pickup-details-tabs">
        <button
          type="button"
          className={`pickup-tab ${addressMode === "manual" ? "active" : ""}`}
          onClick={() => setAddressMode("manual")}
        >
          Manual Address
        </button>
        <button
          type="button"
          className={`pickup-tab ${addressMode === "saved" ? "active" : ""}`}
          onClick={() => {
            setAddressMode("saved");
            onSavedAddressesOpen?.();
          }}
        >
          Saved Address
        </button>
      </div>

      <div className="pickup-details-body">
        <div className="pickup-field">
          <CustomText size="13px" weight="600">
            Date &amp; Time:
          </CustomText>
          <div className="pickup-date-input">
            <span className="pickup-date-icon">🗓️</span>
            <input
              type="datetime-local"
              value={pickupDateTime}
              onChange={(event) => onPickupDateTimeChange?.(event.target.value)}
              placeholder="Choose Date"
            />
          </div>
        </div>

        <div
          className={`pickup-quick-buttons ${shouldShowQuickButtons ? "" : "is-hidden"
            }`}
          aria-hidden={shouldShowQuickButtons ? "false" : "true"}
        >
          <button
            type="button"
            className="pickup-pill"
            onClick={() => {
              const now = new Date();
              const offset = now.getTimezoneOffset() * 60000;
              const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
              onPickupDateTimeChange?.(localISOTime);
            }}
          >
            Today
          </button>
          <button
            type="button"
            className="pickup-pill"
            onClick={() => {
              const tomorrow = new Date(Date.now() + 86400000);
              const offset = tomorrow.getTimezoneOffset() * 60000;
              const localISOTime = new Date(tomorrow - offset).toISOString().slice(0, 16);
              onPickupDateTimeChange?.(localISOTime);
            }}
          >
            Tomorrow
          </button>
        </div>

        {addressMode === "manual" ? (
          <div className="pickup-governorate">
            <CustomText
              className="pickup-governorate-label"
              size="13px"
              weight="600"
            >
              Governorate:
            </CustomText>
            <div className="pickup-governorate-options">
              {availableGovernorates.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={`pickup-pill ${String(governorate || "").toLowerCase() ===
                    item.name.toLowerCase()
                    ? "active"
                    : ""
                    }`}
                  onClick={() => {
                    onGovernorateChange?.(item.name);
                    onGovernorateSelect?.(item.name);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="pickup-saved-list">
              {savedAddressesLoading ? (
                <div className="pickup-saved-item">
                  <CustomText size="14px" weight="600">
                    Loading...
                  </CustomText>
                </div>
              ) : savedAddressesError ? (
                <div
                  className="pickup-saved-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <CustomText size="14px" weight="600">
                    {savedAddressesError}
                  </CustomText>
                  <button
                    type="button"
                    className="pickup-pill"
                    onClick={onSavedAddressesRetry}
                  >
                    Retry
                  </button>
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="pickup-saved-item">
                  <CustomText size="14px" weight="600">
                    No saved addresses found.
                  </CustomText>
                </div>
              ) : (
                savedAddresses.map((address) => (
                  <div
                    className={`pickup-saved-item ${selectedSavedAddressId &&
                      selectedSavedAddressId === address.id
                      ? "is-selected"
                      : ""
                      }`}
                    key={address.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectSavedAddress?.(address)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectSavedAddress?.(address);
                      }
                    }}
                  >
                    <div>
                      <CustomText
                        className="pickup-saved-title"
                        size="16px"
                        weight="700"
                      >
                        {address.title || "Saved Address"}
                      </CustomText>
                      <CustomText
                        className="pickup-saved-subtitle"
                        size="14px"
                        weight="600"
                      >
                        {address.subtitle || "--"}
                      </CustomText>
                    </div>
                    <span className="pickup-saved-arrow">›</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div style={{ display: addressMode === "manual" ? "contents" : "none" }}>
          <CustomText className="pickup-note desktop-only-ui" size="13px" weight="600">
            {hasPickupLocation
              ? "Pick-up location selected on the map."
              : "*Please set the pick up location on the map"}
          </CustomText>

          <CustomText className="pickup-note mobile-only-ui" size="13px" weight="600" style={{ marginTop: '10px' }}>
            Set Location on Map:
          </CustomText>
          <div className="mobile-map-wrapper mobile-only-ui">
            <div id="pickup-mobile-map-target"></div>
            <button className="mobile-map-set-btn" type="button" onClick={onSetLocationClick}>
              📍 Set Location
            </button>
          </div>
        </div>

        {addressMode === "manual" ? (
          <div className="pickup-field">
            <CustomText size="13px" weight="600">
              Further Instructions:
            </CustomText>
            <input
              className="pickup-text-input"
              type="text"
              placeholder="Further Instructions"
              value={instructions}
              onChange={(event) => onInstructionsChange?.(event.target.value)}
            />
          </div>
        ) : null}

      </div>
      <div className="pickup-footer">
        <button
          className="new-shipment-next"
          type="button"
          onClick={handleNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
