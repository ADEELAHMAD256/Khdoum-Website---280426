import { useMemo, useState } from "react";
import CustomText from "../../components/CustomText";

function getShipmentKey(shipment) {
  if (!shipment) return "";
  return (
    shipment._id ||
    shipment.id ||
    shipment.trackingId ||
    shipment.shipmentId ||
    ""
  );
}

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

function formatShortDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(status) {
  const normalized = String(status || "").toLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("delivered") ||
    normalized === "done"
  ) {
    return "#00a859";
  }
  return "#df2429";
}

function getUniqueGovernorates(items, path) {
  const map = new Map();
  items.forEach((shipment) => {
    const raw = shipment?.[path]?.governorate;
    if (typeof raw !== "string") return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!map.has(key)) {
      map.set(key, trimmed);
    }
  });
  return Array.from(map.values());
}

export default function HomeShipments({
  shipments,
  loading,
  error,
  onRetry,
  selectedId,
  onSelect,
  searchValue = "",
  onSearchChange,
}) {
  const [activeFromGov, setActiveFromGov] = useState("");
  const [activeToGov, setActiveToGov] = useState("");

  const items = useMemo(
    () => (Array.isArray(shipments) ? shipments : []),
    [shipments],
  );
  const pickupGovernorates = useMemo(
    () => getUniqueGovernorates(items, "pickup"),
    [items],
  );
  const dropoffGovernorates = useMemo(
    () => getUniqueGovernorates(items, "dropoff"),
    [items],
  );

  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Filter by Search Value
    const search = (searchValue || "").trim().toLowerCase();
    if (search) {
      result = result.filter((shipment) => {
        const name = (shipment.recipient?.name || "").toLowerCase();
        const phone = (shipment.recipient?.phone || "").toLowerCase();
        const tracking = (shipment.trackingId || "").toLowerCase();
        return (
          name.includes(search) ||
          phone.includes(search) ||
          tracking.includes(search)
        );
      });
    }

    // 2. Filter by Governorates
    if (!activeFromGov && !activeToGov) return result;

    const fromWanted = activeFromGov.toLowerCase();
    const toWanted = activeToGov.toLowerCase();

    return result.filter((shipment) => {
      const fromGov = shipment?.pickup?.governorate || "";
      const toGov = shipment?.dropoff?.governorate || "";

      if (fromWanted && fromGov.toLowerCase() !== fromWanted) return false;
      if (toWanted && toGov.toLowerCase() !== toWanted) return false;
      return true;
    });
  }, [items, activeFromGov, activeToGov, searchValue]);

  return (
    <div className="shipments-overlay">
      <div className="shipment-filters">
        <CustomText className="filter-title" size="18px" weight="700">
          All Shipments
        </CustomText>

        <div className="filter-group">
          <CustomText weight="600">From:</CustomText>
          {pickupGovernorates.map((gov) => (
            <button
              key={gov}
              type="button"
              className={activeFromGov === gov ? "is-selected" : ""}
              aria-pressed={activeFromGov === gov}
              onClick={() =>
                setActiveFromGov((current) => (current === gov ? "" : gov))
              }
            >
              {gov}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <CustomText weight="600">To:</CustomText>
          {dropoffGovernorates.map((gov) => (
            <button
              key={gov}
              type="button"
              className={activeToGov === gov ? "is-selected" : ""}
              aria-pressed={activeToGov === gov}
              onClick={() =>
                setActiveToGov((current) => (current === gov ? "" : gov))
              }
            >
              {gov}
            </button>
          ))}
        </div>
      </div>

      <div className="shipment-mobile-search mobile-only-ui">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Phone Number, Or Recipient's Name"
          value={searchValue}
          onChange={onSearchChange}
        />
      </div>

      {loading ? (
        <div className="shipments-empty">
          <CustomText color="#8c8c8c">Loading...</CustomText>
        </div>
      ) : error ? (
        <div className="shipments-empty">
          <CustomText color="#8c8c8c">{error}</CustomText>
          <button className="shipments-retry" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : (
        <div className="shipment-list">
          {filteredItems.length === 0 ? (
            <div className="shipments-empty">
              <CustomText color="#8c8c8c">
                {activeFromGov || activeToGov
                  ? "No shipments found."
                  : "No shipments yet."}
              </CustomText>
            </div>
          ) : (
            filteredItems.map((shipment, index) => {
              const key = shipment.id || index;
              const tracking = shipment.trackingId || "";
              const recipientName = shipment.recipient?.name || "—";
              const courierName = shipment.courier?.name;

              const fromGov = shipment.pickup?.governorate || "";
              const toGov = shipment.dropoff?.governorate || "";

              return (
                <div
                  className={`shipment-item ${key === selectedId ? "selected" : ""}`}
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect?.(key);
                    }
                  }}
                >
                  <CustomText
                    className="shipment-name"
                    size="15px"
                    weight="600"
                  >
                    {recipientName}
                  </CustomText>

                  <CustomText
                    className="shipment-details"
                    size="13px"
                    color="#333"
                  >
                    #{tracking}
                    {fromGov || toGov
                      ? ` | ${fromGov || "—"} → ${toGov || "—"}`
                      : ""}
                    {shipment.updatedAt || shipment.createdAt
                      ? ` | ${formatShortDateTime(shipment.updatedAt || shipment.createdAt)}`
                      : ""}
                  </CustomText>

                  <CustomText
                    className="shipment-status"
                    size="13px"
                    weight="600"
                    color={getStatusColor(shipment.status)}
                  >
                    {shipment.status || "—"}
                  </CustomText>

                  {courierName ? (
                    <CustomText
                      className="shipment-details"
                      size="13px"
                      color="#333"
                    >
                      Courier: {courierName}
                    </CustomText>
                  ) : null}

                  <div className="arrow">›</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
