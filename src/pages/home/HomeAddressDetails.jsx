import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import { useToast } from "../../components/Toast/useToast";

function pickValue(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value === 0) return "0";
    if (typeof value === "number") return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export default function HomeAddressDetails({ address, onBack, onDelete }) {
  const toast = useToast();

  if (!address) {
    return null;
  }

  const name =
    pickValue(address, ["name", "fullName", "customerName", "recipientName"]) ||
    `${pickValue(address, ["firstName"])} ${pickValue(address, ["lastName"])}`.trim() ||
    "—";

  const governorate = pickValue(address, ["governorate"]);
  const whatsappNumber = pickValue(address, [
    "whatsappNumber",
    "whatsAppNumber",
    "whatsapp",
    "whatsApp",
  ]);
  const phoneNumber = pickValue(address, [
    "phoneNumber",
    "phone",
    "mobile",
    "mobileNumber",
  ]);
  const district = pickValue(address, ["district", "area"]);
  const streetName = pickValue(address, ["streetName", "street"]);
  const buildingNumber = pickValue(address, [
    "buildingNumber",
    "buildingNo",
    "building",
  ]);
  const floorNumber = pickValue(address, ["floorNumber", "floor", "floorNo"]);
  const apartmentNumber = pickValue(address, [
    "apartmentNumber",
    "apartmentNo",
    "apartment",
  ]);

  return (
    <div className="address-details-overlay">
      <div className="address-details-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back to address book"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <CustomText className="address-details-title" size="16px" weight="700">
          {name}
          <br />
          Address
        </CustomText>
      </div>

      <CustomText className="address-details-section" size="15px" weight="700">
        Address Details
      </CustomText>

      <div className="address-details-grid">
        <div className="address-details-row">
          <CustomText className="address-details-label">Governorate:</CustomText>
          <CustomText className="address-details-value">
            {governorate || "--"}
          </CustomText>
        </div>
        <div className="address-details-row">
          <CustomText className="address-details-label">
            WhatsApp Number:
          </CustomText>
          <CustomText className="address-details-value">
            {whatsappNumber || "--"}
          </CustomText>
        </div>
        <div className="address-details-row">
          <CustomText className="address-details-label">Phone Number:</CustomText>
          <CustomText className="address-details-value">
            {phoneNumber || "--"}
          </CustomText>
        </div>

        {district ? (
          <div className="address-details-row">
            <CustomText className="address-details-label">District:</CustomText>
            <CustomText className="address-details-value">{district}</CustomText>
          </div>
        ) : null}

        {streetName ? (
          <div className="address-details-row">
            <CustomText className="address-details-label">
              Street Name:
            </CustomText>
            <CustomText className="address-details-value">
              {streetName}
            </CustomText>
          </div>
        ) : null}

        {buildingNumber ? (
          <div className="address-details-row">
            <CustomText className="address-details-label">
              Building No.
            </CustomText>
            <CustomText className="address-details-value">
              {buildingNumber}
            </CustomText>
          </div>
        ) : null}

        {floorNumber ? (
          <div className="address-details-row">
            <CustomText className="address-details-label">Floor:</CustomText>
            <CustomText className="address-details-value">
              {floorNumber}
            </CustomText>
          </div>
        ) : null}

        {apartmentNumber ? (
          <div className="address-details-row">
            <CustomText className="address-details-label">
              Apartment No.
            </CustomText>
            <CustomText className="address-details-value">
              {apartmentNumber}
            </CustomText>
          </div>
        ) : null}
      </div>

      <div className="address-details-actions">
        <button
          className="address-details-btn address-details-delete"
          type="button"
          onClick={() => {
            if (onDelete) {
              onDelete(address);
              return;
            }
            toast.info("Delete is not implemented yet.");
          }}
        >
          Delete
        </button>
        <button
          className="address-details-btn address-details-primary"
          type="button"
          onClick={() => {
            if (!phoneNumber) {
              toast.warning("No phone number found for this address.");
              return;
            }
            window.location.href = `tel:${phoneNumber}`;
          }}
        >
          <span className="address-details-btn-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path
                d="M6.7 2.9c.5-.2 1 .1 1.2.6l1.2 3a1 1 0 0 1-.3 1.1l-1.5 1.2a11.2 11.2 0 0 0 6 6l1.2-1.5a1 1 0 0 1 1.1-.3l3 1.2c.5.2.8.7.6 1.2l-1 2.5c-.2.6-.8 1-1.5.9-6.6-1-11.8-6.2-12.8-12.8-.1-.7.3-1.3.9-1.5l2.5-1Z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
          Call Customer
        </button>
      </div>
    </div>
  );
}
