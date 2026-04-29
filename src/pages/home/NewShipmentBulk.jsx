import { useRef, useState } from "react";
import CustomText from "../../components/CustomText";
import downloadIcon from "../../assets/icons/download_icons.svg";
import uploadIcon from "../../assets/icons/upload_icon.svg";
import { useFileDownload } from "../../hooks/useFileDownload";

export default function NewShipmentBulk({ bulkFile, onBulkFileChange }) {
  const fileInputRef = useRef(null);
  const { isDownloading, progress, downloadFile } = useFileDownload();

  const handleDownload = () => {
    window.alert("Attempting to download template...");
    console.log("Downloading template button clicked");
    const fileName = "Bulk Template(Worksheet).xlsx";
    const url = "https://firebasestorage.googleapis.com/v0/b/couriers-ba686.firebasestorage.app/o/Bulk%20Template%28Worksheet%29.xlsx?alt=media&token=c607b5bf-39f4-49b1-a3fd-55d291e1c3b6";
    downloadFile(url, fileName);
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (onBulkFileChange) onBulkFileChange(file);
      console.log("Selected file:", file.name);
    }
  };

  return (
    <div className="new-shipment-bulk">
      <p className="new-shipment-description">
        This template allows you to enter your recipients&apos; details in an
        Excel sheet, which you can then upload to simplify the process of
        scheduling bulk orders.
      </p>

      <div className="new-shipment-highlight">
        <CustomText
          className="new-shipment-highlight-text"
          size="16px"
          weight="700"
        >
          Template:
        </CustomText>
        {isDownloading ? (
          <div className="downloading-container">
            <span className="downloading-text">Downloading template...</span>
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <button
            className="new-shipment-download"
            type="button"
            onClick={handleDownload}
          >
            <img
              className="new-shipment-download-icon"
              src={downloadIcon}
              alt=""
            />
            Download Template
          </button>
        )}
      </div>

      <div className="new-shipment-list">
        <CustomText size="13px" weight="600">
          In the template, please:
        </CustomText>
        <ol>
          <li>
            Fill in the shipment and drop-off details for all parcels, each in a
            separate row.
          </li>
          <li>Rows that has (*) next to the heading are required.</li>
          <li>Upload the sheet so that we can save you time and effort.</li>
        </ol>
      </div>

      <div className="new-shipment-upload" onClick={handleUploadClick}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv"
          style={{ display: "none" }}
        />
        <div className="new-shipment-upload-icon">
          <img src={uploadIcon} alt="" />
        </div>
        <div className="new-shipment-upload-text">
          {bulkFile ? bulkFile.name : "Upload Your File Here"}
        </div>
        <div className="new-shipment-upload-subtext">Maximum 50mb Size</div>
      </div>
    </div>
  );
}
