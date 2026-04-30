import CustomText from "../../components/CustomText";
import "./NewShipmentBulkSummary.css";

export default function NewShipmentBulkSummary({ 
  shipments, 
  onBack, 
  onSubmit, 
  submitting, 
  onSelect 
}) {
  return (
    <div className="bulk-summary-overlay">
      <div className="bulk-summary-header">
        <button className="details-back-button" onClick={onBack}>
          <span style={{ fontSize: "24px" }}>‹</span>
        </button>
        <CustomText size="18px" weight="700">
          Bulk Shipments Summary
        </CustomText>
      </div>

      <p className="bulk-summary-desc">
        We found <strong>{shipments.length}</strong> shipments in your file. 
        Please review them before submitting.
      </p>

      <div className="bulk-summary-body">
        <div className="bulk-summary-list">
          {shipments.map((item, index) => {
            const key = `bulk-${item.originalRowIndex || index}`;
            return (
              <div 
                key={key} 
                className="shipment-item"
                onClick={() => onSelect?.(key)}
              >
                <CustomText className="shipment-name" size="15px" weight="600">
                  {item.name}
                </CustomText>
                <CustomText className="shipment-details" size="13px">
                  {item.phone || "—"}
                  {item.pickupGov || item.dropoffGov ? ` | ${item.pickupGov || "—"} → ${item.dropoffGov || "—"}` : ""}
                  {item.pickupDate ? ` | ${item.pickupDate}` : ""}
                </CustomText>
                <CustomText className="shipment-status" size="13px" weight="600" color="#df2429">
                  {item.value} JD
                </CustomText>
                <div className="arrow">›</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bulk-summary-footer">
        <button 
          className="new-shipment-next" 
          onClick={onSubmit}
          disabled={submitting || shipments.length === 0}
        >
          {submitting ? "Creating Shipments..." : `Create ${shipments.length} Shipments`}
        </button>
      </div>
    </div>
  );
}

