import CustomText from "../../components/CustomText";
import CustomCheckBox from "../../components/CustomCheckBox";
import boxIcon from "../../assets/images/a.svg";

export default function NewShipmentPiece({
  shipmentValue,
  onShipmentValueChange,
  confirmSize,
  onConfirmSizeChange,
  fragile,
  onFragileChange,
}) {
  const isInvalid =
    shipmentValue !== "" &&
    (Number(shipmentValue) <= 0 || isNaN(Number(shipmentValue)));

  return (
    <>
      <div className="new-shipment-field">
        <CustomText size="13px" weight="600">
          Shipment Value (JD):
        </CustomText>
        <div className="new-shipment-input-wrap">
          <input
            type="text"
            className={isInvalid ? "error" : ""}
            placeholder="Enter amount (JD)"
            value={shipmentValue}
            onChange={onShipmentValueChange}
            inputMode="decimal"
            aria-label="Shipment value in Jordanian dinar"
          />
          <span className="new-shipment-input-icon">!</span>
        </div>
        {isInvalid && (
          <span className="new-shipment-error-text">
            Value must be greater than zero
          </span>
        )}
      </div>

      <div className="new-shipment-field">
        <CustomText size="13px" weight="600">
          Shipment Dimensions:
        </CustomText>
        <div className="new-shipment-dimensions-card">
          <div className="new-shipment-dimensions-image">
            <img src={boxIcon} alt="Shipment dimensions" />
          </div>
          <div className="new-shipment-checkboxes">
            <CustomCheckBox
              value={confirmSize}
              onChange={onConfirmSizeChange}
              label={
                <>
                  I confirm that the shipment size is within the previous
                  shipments and{" "}
                  <span className="new-shipment-highlight">
                    does not exceed the specified limit
                  </span>
                </>
              }
            />
            <CustomCheckBox
              value={fragile}
              onChange={onFragileChange}
              label={
                <>
                  The shipment has{" "}
                  <span className="new-shipment-highlight">fragile content</span>
                </>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
