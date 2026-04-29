import CustomText from "../../components/CustomText";
import "./NewShipmentBulkSummary.css";

export default function NewShipmentBulkSummary({ shipments, onBack, onSubmit, submitting }) {
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

      <div className="bulk-summary-body">
        <p className="bulk-summary-desc">
          We found <strong>{shipments.length}</strong> shipments in your file. 
          Please review them before submitting.
        </p>

        <div className="bulk-summary-list">
          {shipments.map((item, index) => (
            <div key={index} className="bulk-summary-item">
              <div className="bulk-item-info">
                <CustomText size="15px" weight="600">
                  {item.name}
                </CustomText>
                <CustomText size="13px" color="#666">
                  {item.city} | {item.value} JD
                </CustomText>
              </div>
              <div className="bulk-item-date">
                <CustomText size="12px" color="#888">
                  Scheduled on:
                </CustomText>
                <CustomText size="13px" weight="500">
                  {item.date || "Not set"}
                </CustomText>
              </div>
            </div>
          ))}
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
