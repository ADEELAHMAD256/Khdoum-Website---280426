import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import completedIcon from "../../assets/icons/completed.svg";
import pendingIcon from "../../assets/icons/pending.svg";
import cancelShipmentIcon from "../../assets/icons/cancel_shipment.svg";
import whatsappIcon from "../../assets/icons/whatsapp.svg";
import { useToast } from "../../components/Toast/useToast";

export default function HomeShipmentDetails({
  detailsPanels,
  openDetailsPanel,
  onTogglePanel,
  timeline,
  onBack,
  recipientPhone,
  courierPhone,
}) {
  const toast = useToast();

  const getStatusIcon = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "done" || normalized === "complete" || normalized === "completed") {
      return completedIcon;
    }
    return pendingIcon;
  };

  const openWhatsapp = (phone) => {
    const trimmed = String(phone || "").trim();
    if (!trimmed) {
      toast.warning("No phone number found.");
      return;
    }
    const digits = trimmed.replace(/[^\d]/g, "");
    if (!digits) {
      toast.warning("Invalid phone number.");
      return;
    }
    window.open(`https://wa.me/${digits}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="shipment-details-overlay">
      <div className="shipment-details-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back to shipments"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <CustomText size="16px" weight="700">
          Shipment Details
        </CustomText>
      </div>

      <div className="mobile-map-wrapper mobile-only-ui shipment-details-map">
        <div id="shipment-details-mobile-map-target"></div>
      </div>

      <div className="details-panels">
        {detailsPanels.map((panel) => (
          <div className="details-panel" key={panel.key}>
            <button
              className="details-panel-header"
              type="button"
              onClick={() => onTogglePanel(panel.key)}
            >
              <CustomText size="14px" weight="600">
                {panel.title}
              </CustomText>
              <span
                className={`details-panel-arrow ${openDetailsPanel === panel.key ? "open" : ""
                  }`}
              >
                ˅
              </span>
            </button>
            {openDetailsPanel === panel.key && (
              <div className="details-panel-body">
                {panel.rows.map(([label, value]) => (
                  <div className="details-panel-row" key={label}>
                    <CustomText size="13px" weight="600">
                      {label}
                    </CustomText>
                    <CustomText size="13px" color="#555">
                      {value || "--"}
                    </CustomText>
                  </div>
                ))}

              </div>
            )}
          </div>
        ))}
      </div>

      <div className="details-timeline">
        {timeline.map((item) => (
          <div
            className={`details-timeline-item ${item.status}`}
            key={item.id}
          >
            <img
              className="details-timeline-icon"
              src={getStatusIcon(item.status)}
              alt=""
              aria-hidden="true"
            />
            <div className="details-timeline-content">
              <CustomText
                className="details-timeline-date"
                size="12px"
                color="#8b8b8b"
              >
                {item.date} {item.time ? `- ${item.time}` : ""}
              </CustomText>
              <CustomText className="details-timeline-title" size="14px" weight="700">
                {item.title}
              </CustomText>
              <CustomText className="details-timeline-label" size="12px" color="#666">
                {item.label}
              </CustomText>
              {item.action && (
                <div className="details-timeline-actions">
                  <button className="details-timeline-action" type="button">
                    <span className="details-action-icon" aria-hidden="true">
                      <img src={cancelShipmentIcon} alt="" />
                    </span>
                    {item.action}
                    <span className="details-action-arrow">›</span>
                  </button>
                  {recipientPhone ? (
                    <button
                      className="details-timeline-action"
                      type="button"
                      onClick={() => openWhatsapp(recipientPhone)}
                    >
                      <span className="details-action-icon" aria-hidden="true">
                        <img src={whatsappIcon} alt="" />
                      </span>
                      Message Recipient
                      <span className="details-action-arrow">›</span>
                    </button>
                  ) : null}
                  {courierPhone ? (
                    <button
                      className="details-timeline-action"
                      type="button"
                      onClick={() => openWhatsapp(courierPhone)}
                    >
                      <span className="details-action-icon" aria-hidden="true">
                        <img src={whatsappIcon} alt="" />
                      </span>
                      Message Courier
                      <span className="details-action-arrow">›</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
