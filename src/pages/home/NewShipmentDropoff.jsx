import { useState } from "react";
import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import PhoneNumberInputWithCountry from "../../components/PhoneNumberInput";
import { useToast } from "../../components/Toast/useToast";

export default function NewShipmentDropoff({
  onBack,
  onNext,
  submitting = false,
  governorates: governorateOptions = [],
  onGovernorateSelect,
  dropoffDateTime = "",
  onDropoffDateTimeChange,
  governorate = "",
  onGovernorateChange,
  recipientName = "",
  onRecipientNameChange,
  recipientPhone = "",
  recipientDialCode,
  onRecipientPhoneChange,
  instructions = "",
  onInstructionsChange,
  dropoffLocation,
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

  const getSavedAddressTitle = (address) =>
    address?.title || address?.name || "Saved Address";

  const getSavedAddressSubtitle = (address) => {
    if (address?.subtitle) return address.subtitle;
    const parts = [address?.governorate, address?.district, address?.streetName]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);
    return parts.length ? parts.join(" - ") : "--";
  };

  const availableGovernorates =
    Array.isArray(governorateOptions) && governorateOptions.length > 0
      ? governorateOptions
      : [{ name: "Irbid" }, { name: "Zarqa" }, { name: "Amman" }];

  const hasDropoffLocation =
    dropoffLocation &&
    typeof dropoffLocation.lat === "number" &&
    typeof dropoffLocation.lng === "number";
  const selectedSavedAddressId = selectedSavedAddress?.id;
  const shouldShowQuickButtons = !String(dropoffDateTime || "").trim();

  const handleNext = () => {
    if (!dropoffDateTime) {
      toast.warning("Please choose drop-off date & time.");
      return;
    }

    if (addressMode === "manual") {
      if (!recipientName.trim()) {
        toast.warning("Please enter recipient name.");
        return;
      }

      const normalizedRecipientPhone = String(recipientPhone || "").replace(
        /\s+/g,
        "",
      );
      if (!normalizedRecipientPhone || normalizedRecipientPhone.length < 7) {
        toast.warning("Please enter a valid recipient phone number.");
        return;
      }

      if (!governorate) {
        toast.warning("Please select drop-off governorate.");
        return;
      }
    } else {
      if (!selectedSavedAddressId) {
        toast.warning("Please select a saved address.");
        return;
      }

      if (!recipientName.trim()) {
        toast.warning("Selected saved address is missing recipient name.");
        return;
      }

      const normalizedRecipientPhone = String(recipientPhone || "").replace(
        /\s+/g,
        "",
      );
      if (!normalizedRecipientPhone || normalizedRecipientPhone.length < 7) {
        toast.warning(
          "Selected saved address is missing recipient phone number.",
        );
        return;
      }
    }

    if (!hasDropoffLocation) {
      toast.warning("Please select the drop-off location on the map.");
      return;
    }

    onNext?.();
  };

  if (isMobileMapFullscreen) {
    return null;
  }

  return (
    <div className="dropoff-details-overlay">
      <div className="dropoff-details-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back to pick-up details"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <CustomText size="16px" weight="700">
          Drop-Off Details
        </CustomText>
      </div>

      <div className="dropoff-details-tabs">
        <button
          type="button"
          className={`dropoff-tab ${addressMode === "manual" ? "active" : ""}`}
          onClick={() => setAddressMode("manual")}
        >
          Manual Address
        </button>
        <button
          type="button"
          className={`dropoff-tab ${addressMode === "saved" ? "active" : ""}`}
          onClick={() => {
            setAddressMode("saved");
            onSavedAddressesOpen?.();
          }}
        >
          Saved Address
        </button>
      </div>

      <div className="dropoff-details-body">
        {addressMode === "manual" ? (
          <>
            <div className="dropoff-field">
              <CustomText size="13px" weight="600">
                Full Name:
              </CustomText>
              <input
                className="dropoff-text-input"
                type="text"
                placeholder="Recipient full name"
                value={recipientName}
                onChange={(event) => onRecipientNameChange?.(event.target.value)}
              />
            </div>

            <div className="dropoff-field">
              <CustomText size="13px" weight="600">
                Mobile Number:
              </CustomText>

              <PhoneNumberInputWithCountry
                value={recipientPhone}
                dialCode={recipientDialCode}
                onChange={onRecipientPhoneChange}
                compact
                containerStyle={{ maxWidth: "none" }}
              />
            </div>
          </>
        ) : null}

        <div className="dropoff-field">
          <CustomText size="13px" weight="600">
            Date &amp; Time:
          </CustomText>
          <div className="dropoff-date-input">
            <span className="dropoff-date-icon">🗓️</span>
            <input
              type="datetime-local"
              value={dropoffDateTime}
              onChange={(event) => onDropoffDateTimeChange?.(event.target.value)}
              placeholder="Choose Date"
            />
          </div>
        </div>

        <div
          className={`dropoff-quick-buttons ${shouldShowQuickButtons ? "" : "is-hidden"
            }`}
          aria-hidden={shouldShowQuickButtons ? "false" : "true"}
        >
          <button
            type="button"
            className="dropoff-pill"
            onClick={() =>
              onDropoffDateTimeChange?.(new Date().toISOString().slice(0, 16))
            }
          >
            Today
          </button>
          <button
            type="button"
            className="dropoff-pill"
            onClick={() =>
              onDropoffDateTimeChange?.(
                new Date(Date.now() + 86400000).toISOString().slice(0, 16),
              )
            }
          >
            Tomorrow
          </button>
        </div>

        {addressMode === "manual" ? (
          <div className="dropoff-governorate">
            <CustomText
              className="dropoff-governorate-label"
              size="13px"
              weight="600"
            >
              Governorate:
            </CustomText>
            <div className="dropoff-governorate-options">
              {availableGovernorates.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className={`dropoff-pill ${String(governorate || "").toLowerCase() ===
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
            <div className="dropoff-saved-list">
              {savedAddressesLoading ? (
                <div className="dropoff-saved-item">
                  <CustomText size="14px" weight="600">
                    Loading...
                  </CustomText>
                </div>
              ) : savedAddressesError ? (
                <div
                  className="dropoff-saved-item"
                  style={{ justifyContent: "space-between" }}
                >
                  <CustomText size="14px" weight="600">
                    {savedAddressesError}
                  </CustomText>
                  <button
                    type="button"
                    className="dropoff-pill"
                    onClick={onSavedAddressesRetry}
                  >
                    Retry
                  </button>
                </div>
              ) : savedAddresses.length === 0 ? (
                <div className="dropoff-saved-item">
                  <CustomText size="14px" weight="600">
                    No saved addresses found.
                  </CustomText>
                </div>
              ) : (
                savedAddresses.map((address) => (
                  <div
                    className={`dropoff-saved-item ${selectedSavedAddressId &&
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
                        className="dropoff-saved-title"
                        size="16px"
                        weight="700"
                      >
                        {getSavedAddressTitle(address)}
                      </CustomText>
                      <CustomText
                        className="dropoff-saved-subtitle"
                        size="14px"
                        weight="600"
                      >
                        {getSavedAddressSubtitle(address)}
                      </CustomText>
                    </div>
                    <span className="dropoff-saved-arrow">›</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div style={{ display: addressMode === "manual" ? "contents" : "none" }}>
          <CustomText className="dropoff-note desktop-only-ui" size="13px" weight="600">
            {hasDropoffLocation
              ? "Drop-off location selected on the map."
              : "*Please set the drop off location on the map"}
          </CustomText>

          <CustomText className="dropoff-note mobile-only-ui" size="13px" weight="600" style={{ marginTop: '10px' }}>
            Set Location on Map:
          </CustomText>
          <div className="mobile-map-wrapper mobile-only-ui">
            <div id="dropoff-mobile-map-target"></div>
            <button className="mobile-map-set-btn" type="button" onClick={onSetLocationClick}>
              📍 Set Location
            </button>
          </div>

          <div className="dropoff-field">
            <CustomText size="13px" weight="600">
              Further Instructions:
            </CustomText>
            <input
              className="dropoff-text-input"
              type="text"
              placeholder="Further Instructions"
              value={instructions}
              onChange={(event) => onInstructionsChange?.(event.target.value)}
            />
          </div>
        </div>

      </div>
      <div className="dropoff-footer">
        <button
          className="new-shipment-next"
          type="button"
          onClick={handleNext}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Next"}
        </button>
      </div>
    </div>
  );
}
