// BulkShipmentInstructions.jsx
import React from "react";
import "./bulkShipment.css"; // new file for styling

export default function BulkShipmentInstructions() {
  return (
    <div className="bulk-shipment-container">
      <p className="bulk-description">
        This template allows you to enter your recipients' details in an Excel
        sheet, which you can then upload to simplify the process of scheduling
        bulk orders.
      </p>

      <div className="bulk-highlight">
        <strong>Ask recipients to fill in the address:</strong>
        <button className="bulk-download-btn">
          <i className="icon-download" /> Download Template
        </button>
      </div>

      <div className="bulk-list">
        <p>In the template, please:</p>
        <ol>
          <li>
            Fill in the shipment and drop-off details for all parcels, each in a
            separate row.
          </li>
          <li>Rows that has (*) next to the heading are required.</li>
          <li>Upload the sheet so that we can save you time and effort.</li>
        </ol>
      </div>

      <div className="bulk-upload-box">
        <i className="icon-upload" />
        <p className="upload-text">Upload Your File Here</p>
        <p className="upload-subtext">Maximum 50mb Size</p>
      </div>
    </div>
  );
}
