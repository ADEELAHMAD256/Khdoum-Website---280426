import { useMemo, useState } from "react";
import CustomText from "../../components/CustomText";

function getAddressName(address) {
  if (!address) return "—";
  if (typeof address.name === "string" && address.name.trim())
    return address.name;
  if (typeof address.fullName === "string" && address.fullName.trim())
    return address.fullName;
  if (typeof address.customerName === "string" && address.customerName.trim())
    return address.customerName;
  if (typeof address.recipientName === "string" && address.recipientName.trim())
    return address.recipientName;
  if (typeof address.receiverName === "string" && address.receiverName.trim())
    return address.receiverName;
  if (typeof address.contactName === "string" && address.contactName.trim())
    return address.contactName;

  const firstName =
    typeof address.firstName === "string" ? address.firstName.trim() : "";
  const lastName =
    typeof address.lastName === "string" ? address.lastName.trim() : "";
  const composed = `${firstName} ${lastName}`.trim();
  if (composed) return composed;

  if (typeof address.phone === "string" && address.phone.trim())
    return address.phone;

  return "—";
}

function getAddressStatus(address) {
  const raw = address?.status;

  const confirmed =
    raw === "confirmed" ||
    raw === "Confirmed" ||
    raw === "complete" ||
    raw === "completed" ||
    address?.confirmed === true ||
    address?.isConfirmed === true;

  if (confirmed) {
    return { className: "status-confirmed", label: "Confirmed" };
  }

  // Match the screenshot label even if API uses "pending".
  if (typeof raw === "string" && raw.trim()) {
    const lower = raw.toLowerCase();
    if (lower.includes("confirm")) {
      return { className: "status-confirmed", label: "Confirmed" };
    }
    if (lower.includes("complete")) {
      return { className: "status-confirmed", label: "Confirmed" };
    }
    if (lower.includes("pending")) {
      return { className: "status-pending", label: "Pending Confirmation" };
    }
  }

  return { className: "status-pending", label: "Pending Confirmation" };
}

export default function HomeAddressBook({
  addresses,
  accounts,
  loading = false,
  error = "",
  onRetry,
  onSelect,
  searchValue = "",
}) {
  const [activeGovernorate, setActiveGovernorate] = useState("");

  const items = useMemo(() => {
    if (Array.isArray(addresses)) return addresses;
    if (Array.isArray(accounts)) return accounts;
    return [];
  }, [addresses, accounts]);

  const governorates = useMemo(() => {
    const set = new Set();
    items.forEach((addr) => {
      const g =
        addr.governorate ||
        addr.Governorate ||
        addr.city ||
        addr.emirate ||
        addr.state;
      if (typeof g === "string" && g.trim()) {
        set.add(g.trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    // 1. Filter by Search Value
    const search = (searchValue || "").trim().toLowerCase();
    if (search) {
      result = result.filter((address) => {
        const name = getAddressName(address).toLowerCase();
        const phone = (address.phone || "").toLowerCase();
        const customerPhone = (address.customerPhone || "").toLowerCase();
        return name.includes(search) || phone.includes(search) || customerPhone.includes(search);
      });
    }

    // 2. Filter by Governorate
    if (!activeGovernorate) return result;
    const wanted = activeGovernorate.toLowerCase();
    return result.filter((address) => {
      const gov =
        (typeof address?.governorate === "string" && address.governorate) ||
        (typeof address?.Governorate === "string" && address.Governorate) ||
        "";
      return gov.toLowerCase() === wanted;
    });
  }, [items, activeGovernorate, searchValue]);

  return (
    <div className="address-book-overlay">
      <CustomText className="address-book-title" size="18px" weight="700">
        Address Book
      </CustomText>

      <div className="address-book-filters">
        <CustomText weight="600">Governorate:</CustomText>
        {governorates.map((gov) => (
          <button
            key={gov}
            type="button"
            className={activeGovernorate === gov ? "is-selected" : ""}
            aria-pressed={activeGovernorate === gov}
            onClick={() =>
              setActiveGovernorate((current) => (current === gov ? "" : gov))
            }
          >
            {gov}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="address-book-empty">
          <CustomText color="#8c8c8c">Loading...</CustomText>
        </div>
      ) : error ? (
        <div className="address-book-empty">
          <CustomText color="#8c8c8c">{error}</CustomText>
          <button
            className="address-book-retry"
            type="button"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="address-book-list">
          {filteredItems.length === 0 ? (
            <div className="address-book-empty">
              <CustomText color="#8c8c8c">
                {activeGovernorate
                  ? "No addresses found for this governorate."
                  : "No addresses found."}
              </CustomText>
            </div>
          ) : (
            filteredItems.map((address, index) => {
              const key =
                address?.id || address?._id || address?.addressId || index;
              const status = getAddressStatus(address);
              return (
                <div
                  className="address-book-item"
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(address)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect?.(address);
                    }
                  }}
                >
                  <div>
                    <CustomText
                      className="address-book-name"
                      size="15px"
                      weight="600"
                    >
                      {getAddressName(address)}
                    </CustomText>
                    <CustomText
                      className={`address-book-status ${status.className}`}
                      size="13px"
                      weight="600"
                      color="inherit"
                    >
                      {status.label}
                    </CustomText>
                  </div>
                  <div className="address-book-arrow">›</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
