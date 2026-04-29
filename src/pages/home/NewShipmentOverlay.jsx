import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import NewShipmentPiece from "./NewShipmentPiece";
import NewShipmentBulk from "./NewShipmentBulk";

export default function NewShipmentOverlay({
  onBack,
  onNext,
  newShipmentTab,
  onTabChange,
  shipmentValue,
  onShipmentValueChange,
  confirmSize,
  onConfirmSizeChange,
  fragile,
  onFragileChange,
  bulkFile,
  onBulkFileChange,
}) {
  return (
    <div className="new-shipment-overlay">
      <div className="new-shipment-header">
        <CustomText className="new-shipment-title" size="16px" weight="700">
          New Shipment Details
        </CustomText>
      </div>

      <div className="new-shipment-tabs">
        <button
          type="button"
          className={`new-shipment-tab ${
            newShipmentTab === "piece" ? "active" : ""
          }`}
          onClick={() => onTabChange("piece")}
        >
          Ship by Piece
        </button>
        <button
          type="button"
          className={`new-shipment-tab ${
            newShipmentTab === "bulk" ? "active" : ""
          }`}
          onClick={() => onTabChange("bulk")}
        >
          Bulk Shipments
        </button>
      </div>

      <div className="new-shipment-body">
      {newShipmentTab === "bulk" ? (
        <NewShipmentBulk bulkFile={bulkFile} onBulkFileChange={onBulkFileChange} />
      ) : (
        <NewShipmentPiece
          shipmentValue={shipmentValue}
          onShipmentValueChange={onShipmentValueChange}
          confirmSize={confirmSize}
          onConfirmSizeChange={onConfirmSizeChange}
          fragile={fragile}
          onFragileChange={onFragileChange}
        />
      )}

      </div>
      <div className="new-shipment-footer">
        <button className="new-shipment-next" type="button" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
}
