import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import completedIcon from "../../assets/icons/completed.svg";
import pendingIcon from "../../assets/icons/pending.svg";
import cancelShipmentIcon from "../../assets/icons/cancel_shipment.svg";
import whatsappIcon from "../../assets/icons/whatsapp.svg";
import "./ShipmentDetails.css";
import { useToast } from "../../components/Toast/useToast";
import { getShipmentById } from "../../services/api/shipmentApi";

function getPersonName(person) {
  if (!person) return "";
  const first = typeof person.firstName === "string" ? person.firstName : "";
  const last = typeof person.lastName === "string" ? person.lastName : "";
  const name = `${first} ${last}`.trim();
  if (name) return name;
  if (typeof person.phone === "string" && person.phone.trim())
    return person.phone.trim();
  if (typeof person.whatsapp === "string" && person.whatsapp.trim())
    return person.whatsapp.trim();
  return "";
}

function formatDateOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeShipment(raw) {
  if (!raw || typeof raw !== "object") return null;
  if (raw._normalized) return raw;

  const recipient = raw.recipient || {};
  const courier = raw.courier || {};
  const pickup = raw.pickUpDetails || {};
  const dropoff = raw.dropOffDetails || {};
  const pickupLoc = pickup.location || {};
  const dropoffLoc = dropoff.location || {};
  const payment = raw.paymentDetails || {};
  const summary = raw.summary || {};

  return {
    id: raw._id || raw.id || raw.trackingId || raw.shipmentId,
    trackingId: raw.trackingId || raw.shipmentId || raw._id,
    status: raw.status || "Created",
    type: raw.type || "Piece",
    value: raw.value,
    isFragile: Boolean(raw.isFragile),
    needCooling: Boolean(raw.needCooling),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    imageUrl: raw.imageUrl,

    recipient: {
      id: recipient.userId || recipient._id || recipient.id,
      name: getPersonName(recipient),
      phone: recipient.phone || recipient.whatsapp,
      whatsapp: recipient.whatsapp,
    },

    courier: raw.courier ? {
      id: courier.userId || courier._id || courier.id,
      name: getPersonName(courier),
      phone: courier.phone || courier.whatsapp,
    } : null,

    pickup: {
      date: pickup.date,
      time: pickup.time,
      governorate: pickupLoc.governorate,
      district: pickupLoc.district,
      streetName: pickupLoc.streetName,
      buildingNumber: pickupLoc.buildingNumber,
      floorNumber: pickupLoc.floorNumber,
      apartmentNumber: pickupLoc.apartmentNumber,
      closestLandmark: pickupLoc.closestLandmark,
      latitude: pickupLoc.latitude,
      longitude: pickupLoc.longitude,
    },

    dropoff: {
      date: dropoff.date,
      time: dropoff.time,
      governorate: dropoffLoc.governorate,
      district: dropoffLoc.district,
      streetName: dropoffLoc.streetName,
      buildingNumber: dropoffLoc.buildingNumber,
      floorNumber: dropoffLoc.floorNumber,
      apartmentNumber: dropoffLoc.apartmentNumber,
      closestLandmark: dropoffLoc.closestLandmark,
      latitude: dropoffLoc.latitude,
      longitude: dropoffLoc.longitude,
    },

    payment: {
      amount: payment.amount ?? summary.finalCost ?? summary.totalCost,
      currency: (payment.currency ?? summary.currency) || "JOD",
      status: payment.paymentStatus || payment.status,
      feePaidBy: raw.shipmentFeePaidBy,
      settlementStatus: raw.settlementStatus,
    },

    trackingStatus: Array.isArray(raw.trackingStatus) ? raw.trackingStatus : [],
    notes: raw.notes || raw.shipmentDetails?.notes,

    _raw: raw,
    _normalized: true,
  };
}

function getShipmentTimeline(shipment) {
  const tracking = Array.isArray(shipment?.trackingStatus)
    ? shipment.trackingStatus
    : [];
  if (tracking.length === 0) return [];

  return tracking.map((item, index) => {
    const isLast = index === tracking.length - 1;
    const timestamp = item?.timestamp;
    const date = timestamp ? new Date(timestamp) : null;
    const dateLabel =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        : "";
    const timeLabel =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })
        : "";

    return {
      id: `${shipment?.id || index}-tl-${index}`,
      title: item?.status || "Status update",
      label: item?.location || item?.reason || "",
      time: timeLabel,
      date: dateLabel,
      status: isLast ? "current" : "done",
    };
  });
}

export default function ShipmentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [openPanel, setOpenPanel] = useState("pickup");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      if (!id) {
        setError("Missing shipment ID.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const response = await getShipmentById(id);
        const data = response?.shipment || response?.data?.shipment || response?.data || response;
        setShipment(normalizeShipment(data));
      } catch (err) {
        setError(err?.message || "Failed to load shipment details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const hasImage = Boolean(shipment?.imageUrl);
  const courierName = getPersonName(shipment?.courier);
  const recipientName = getPersonName(shipment?.recipient);
  const timeline = useMemo(() => getShipmentTimeline(shipment), [shipment]);

  const getTimelineIcon = (status) => {
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

  const panels = useMemo(() => {
    if (!shipment) return [];

    const { 
      pickup = {}, 
      dropoff = {}, 
      payment = {}, 
      courier = null, 
      status = "", 
      trackingId = "", 
      type = "", 
      value = "", 
      notes = "" 
    } = shipment;

    const list = [
      {
        key: "pickup",
        title: "Pick-Up Details",
        rows: [
          ["Pick-Up Governorate", pickup.governorate],
          ["District", pickup.district],
          ["Street Name", pickup.streetName],
          ["Building Number", pickup.buildingNumber],
          ["Floor Number", pickup.floorNumber],
          ["Apartment Number", pickup.apartmentNumber],
          ["Closest Landmark", pickup.closestLandmark],
          ["Pick-Up Date", formatDateOnly(pickup.date)],
          ["Pick-Up Time", pickup.time],
        ],
      },
      {
        key: "shipment",
        title: "Shipment Details",
        rows: [
          ["Tracking ID", trackingId],
          ["Type", type],
          ["Value", value],
          ["Status", status],
          ["Notes", notes],
        ],
      },
      {
        key: "payment",
        title: "Payment Details",
        rows: [
          [
            "Amount",
            payment.amount != null || payment.currency
              ? `${payment.amount ?? ""} ${payment.currency ?? ""}`.trim()
              : "",
          ],
          ["Payment Status", payment.status],
          ["Fee Paid By", payment.feePaidBy],
        ],
      },
      {
        key: "dropoff",
        title: "Drop-Off Details",
        rows: [
          ["Drop-Off Governorate", dropoff.governorate],
          ["District", dropoff.district],
          ["Street Name", dropoff.streetName],
          ["Building Number", dropoff.buildingNumber],
          ["Floor Number", dropoff.floorNumber],
          ["Apartment Number", dropoff.apartmentNumber],
          ["Closest Landmark", dropoff.closestLandmark],
        ],
      },
    ];

    if (courier) {
      list.splice(2, 0, {
        key: "courier",
        title: "Courier Details",
        rows: [
          ["Name", courier.name],
          ["Phone", courier.phone],
        ],
      });
    }

    return list;
  }, [shipment]);

  if (loading) {
    return (
      <div className="shipment-details-page" style={{ justifyContent: "center", alignItems: "center" }}>
        <CustomText>Loading shipment details...</CustomText>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="shipment-details-page" style={{ justifyContent: "center", alignItems: "center" }}>
        <CustomText color="#df2429">{error || "Shipment not found."}</CustomText>
        <button onClick={() => navigate(-1)} style={{ marginTop: "20px", padding: "10px 20px" }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="shipment-details-page">
      <div className="shipment-details-header">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <div className="header-titles">
          <CustomText size="18px" weight="700">
            {recipientName || "—"}
          </CustomText>
          <CustomText size="13px" color="#666">
            Tracking: {shipment.trackingId}
          </CustomText>
        </div>
      </div>

      <div className="shipment-details-body">
        <div className="courier-card">
          <div className="courier-avatar">🚚</div>
          <CustomText size="16px" weight="700">
            {!shipment.courier
              ? "Waiting for courier assignment."
              : hasImage
                ? `${courierName} was your Courier!`
                : `${courierName} is your Courier!`}
          </CustomText>
        </div>

        <div className="media-wrapper">
          {hasImage ? (
            <img
              src={shipment.imageUrl}
              alt="Shipment status"
              className="shipment-image"
            />
          ) : (
            <div className="shipment-map-placeholder">
              <CustomText size="14px" weight="600" color="#666">
                Map preview will appear here
              </CustomText>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button className="outline-button" type="button">
            Print Shipment Label
          </button>
          <button className="outline-button dark" type="button">
            Print Shipment Receipt
          </button>
        </div>

        <div className="section-title">
          <CustomText size="14px" weight="700">
            Address Details
          </CustomText>
        </div>

        <div className="expansion-panels">
          {panels.map((panel) => (
            <div className="panel" key={panel.key}>
              <button
                className="panel-header"
                type="button"
                onClick={() =>
                  setOpenPanel((current) =>
                    current === panel.key ? "" : panel.key
                  )
                }
              >
                <CustomText size="14px" weight="600">
                  {panel.title}
                </CustomText>
                <span className="panel-arrow">
                  {openPanel === panel.key ? "−" : "+"}
                </span>
              </button>
              {openPanel === panel.key && (
                <div className="panel-body">
                  {panel.rows.map(([label, value]) => (
                    <div className="panel-row" key={`${panel.key}-${label}`}>
                      <CustomText size="13px" weight="600">
                        {label}:
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

        {timeline.length > 0 && (
          <>
            <div className="section-title timeline-title">
              <CustomText size="14px" weight="700">
                Shipment Timeline
              </CustomText>
            </div>

            <div className="timeline">
              {timeline.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <img
                    className="timeline-icon"
                    src={getTimelineIcon(item.status)}
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="timeline-content">
                    <div className="timeline-title-row">
                      <CustomText size="14px" weight="600">
                        {item.title}
                      </CustomText>
                      <CustomText size="12px" color="#888">
                        {item.time}
                      </CustomText>
                    </div>
                    <CustomText size="12px" color="#666">
                      {item.label}
                    </CustomText>
                    {item.date && (
                      <CustomText size="12px" color="#999">
                        {item.date}
                      </CustomText>
                    )}
                    {(item.status === "current" || item.id.includes("cancel")) && (
                      <div className="timeline-actions">
                        <button className="timeline-action" type="button">
                          <span className="timeline-action-icon" aria-hidden="true">
                            <img src={cancelShipmentIcon} alt="" />
                          </span>
                          Cancel Shipment
                          <span className="timeline-action-arrow">›</span>
                        </button>
                        {shipment.recipient.phone && (
                          <button
                            className="timeline-action"
                            type="button"
                            onClick={() => openWhatsapp(shipment.recipient.phone)}
                          >
                            <span className="timeline-action-icon" aria-hidden="true">
                              <img src={whatsappIcon} alt="" />
                            </span>
                            Message Recipient
                            <span className="timeline-action-arrow">›</span>
                          </button>
                        )}
                        {shipment.courier?.phone && (
                          <button
                            className="timeline-action"
                            type="button"
                            onClick={() => openWhatsapp(shipment.courier.phone)}
                          >
                            <span className="timeline-action-icon" aria-hidden="true">
                              <img src={whatsappIcon} alt="" />
                            </span>
                            Message Courier
                            <span className="timeline-action-arrow">›</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
