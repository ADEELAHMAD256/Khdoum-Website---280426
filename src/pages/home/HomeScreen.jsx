import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeScreen.css";
import Sidebar from "../Sidebar/Sidebar";
import pickupIcon from "../../assets/icons/pickup.png";
import dropoffIcon from "../../assets/icons/dropoff.png";
import courierIcon from "../../assets/icons/car.png";
import { useHomeScreenLogic } from "./HomeScreen.js";
import NewShipmentOverlay from "./NewShipmentOverlay";
import HomeAddressBook from "./HomeAddressBook";
import HomeShipmentDetails from "./HomeShipmentDetails";
import HomeShipments from "./HomeShipments";
import HomeAddressDetails from "./HomeAddressDetails";
import NewShipmentPickup from "./NewShipmentPickup";
import NewShipmentDropoff from "./NewShipmentDropoff";
import NewShipmentCheckout from "./NewShipmentCheckout";
import NewShipmentPayment from "./NewShipmentPayment";
import AddCardOverlay from "./AddCardOverlay";
import NewShipmentBulkSummary from "./NewShipmentBulkSummary";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import * as xlsx from "xlsx";
import {
  clearAuth,
  getAuthPhoneNumber,
  getAuthUserId,
} from "../../services/auth/authStorage";
import { getAddresses } from "../../services/api/addressBookApi";
import {
  getMyAddresses,
  getProfile,
  getPaymentMethods,
} from "../../services/api/sellerApi";
import {
  createShipment,
  getShipmentHistory,
  updateTrackingStatus,
} from "../../services/api/shipmentApi";
import { createRecipient } from "../../services/api/recipientApi";
import {
  getCountryDefaults,
  getCountryKeyFromPhoneNumber,
  getGovernorateCenter,
  getGovernoratesForCountry,
} from "../../constants/governorates";
import { useToast } from "../../components/Toast/useToast";

function extractProfile(response) {
  if (!response) return null;
  if (typeof response === "string") {
    try {
      return extractProfile(JSON.parse(response));
    } catch {
      return null;
    }
  }
  return (
    response?.data?.user ||
    response?.data?.seller ||
    response?.data ||
    response?.user ||
    response?.seller ||
    response?.profile ||
    response
  );
}

function getSellerIdFromProfile(profile) {
  if (!profile) return null;
  return (
    profile.sellerId ||
    profile.sellerID ||
    profile._id ||
    profile.id ||
    profile.userId ||
    profile.userID ||
    null
  );
}

function normalizeAddressBookEntry(entry) {
  const recipient = entry?.recipient || {};
  const addresses = Array.isArray(entry?.addresses) ? entry.addresses : [];
  const primaryAddress = addresses[0] || {};

  const firstName =
    typeof recipient.firstName === "string" ? recipient.firstName : "";
  const lastName =
    typeof recipient.lastName === "string" ? recipient.lastName : "";
  const name =
    `${firstName} ${lastName}`.trim() ||
    recipient.fullName ||
    recipient.name ||
    recipient.phone ||
    "—";

  const phoneNumber = recipient.phone || "";
  const whatsappNumber =
    recipient.whatsapp || recipient.whatsApp || recipient.whatsAppNumber || "";
  const governorate = primaryAddress.governorate || recipient.governorate || "";

  const latitude =
    typeof primaryAddress.latitude === "number"
      ? primaryAddress.latitude
      : typeof primaryAddress.latitude === "string"
        ? Number(primaryAddress.latitude)
        : null;
  const longitude =
    typeof primaryAddress.longitude === "number"
      ? primaryAddress.longitude
      : typeof primaryAddress.longitude === "string"
        ? Number(primaryAddress.longitude)
        : null;
  const locationLink =
    typeof latitude === "number" && typeof longitude === "number"
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : "";

  return {
    id:
      recipient._id ||
      recipient.id ||
      primaryAddress._id ||
      primaryAddress.id ||
      entry?._id ||
      entry?.id,
    name,
    status: recipient.status || primaryAddress.status || entry?.status || "",
    governorate,
    whatsappNumber,
    phoneNumber,
    district: primaryAddress.district ?? "",
    streetName: primaryAddress.streetName ?? "",
    buildingNumber: primaryAddress.buildingNumber ?? "",
    floorNumber: primaryAddress.floorNumber ?? "",
    apartmentNumber: primaryAddress.apartmentNumber ?? "",
    closestLandmark:
      primaryAddress.closestLandmark ??
      primaryAddress.landmark ??
      recipient.closestLandmark ??
      recipient.landmark ??
      "",
    furtherInstructions:
      primaryAddress.furtherInstructions ??
      primaryAddress.furtherInstruction ??
      primaryAddress.instructions ??
      primaryAddress.instruction ??
      recipient.furtherInstructions ??
      recipient.furtherInstruction ??
      recipient.instructions ??
      recipient.instruction ??
      "",
    latitude:
      typeof latitude === "number" && Number.isFinite(latitude)
        ? latitude
        : null,
    longitude:
      typeof longitude === "number" && Number.isFinite(longitude)
        ? longitude
        : null,
    locationLink,

    // Keep raw objects in case we need them later.
    recipient,
    addresses,
    primaryAddress,
  };
}

function parseMaybeJson(response) {
  if (!response) return response;
  if (typeof response !== "string") return response;
  try {
    return JSON.parse(response);
  } catch {
    return response;
  }
}

function splitFullName(fullName) {
  const normalized = String(fullName || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!normalized) return { firstName: "", lastName: "" };
  const parts = normalized.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function extractRecipientId(response) {
  const data = parseMaybeJson(response);
  return (
    data?.data?.userId ||
    data?.data?.userID ||
    data?.recipient?.userId ||
    data?.recipient?.userID ||
    data?.data?._id ||
    data?.data?.id ||
    data?.recipient?._id ||
    data?.recipient?.id ||
    null
  );
}

function extractTrackingIds(response) {
  const data = parseMaybeJson(response);
  const ids = new Set();

  const visit = (node, depth = 0) => {
    if (!node || depth > 6) return;
    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof node !== "object") return;

    const trackingId = node.trackingId ?? node.trackingID;
    const shipmentId = node.shipmentId ?? node.shipmentID;
    const candidate = trackingId ?? shipmentId;
    if (candidate != null) {
      const normalized = String(candidate).trim();
      if (normalized) ids.add(normalized);
    }

    Object.values(node).forEach((value) => visit(value, depth + 1));
  };

  visit(data);
  return Array.from(ids);
}

function parseDialCodeFromPhoneNumber(phoneNumber) {
  const normalized = String(phoneNumber || "")
    .trim()
    .replace(/\s+/g, "");
  if (!normalized.startsWith("+")) return null;
  if (normalized.startsWith("+971")) return "+971";
  if (normalized.startsWith("+962")) return "+962";
  if (normalized.startsWith("+92")) return "+92";
  return null;
}

function splitDateTime(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return { date: "", time: "" };
  const [date, time = ""] = normalized.split("T");
  return { date: date || "", time: time || "" };
}

function mapShipmentType(type) {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  if (normalized === "bulk") return "Bulk";
  return "Piece";
}

function toNonEmptyString(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function buildLocationPayload({
  governorate,
  district,
  streetName,
  buildingNumber,
  floorNumber,
  apartmentNumber,
  closestLandmark,
  furtherInstructions,
  latitude,
  longitude,
}) {
  return {
    governorate,
    ...(toNonEmptyString(district)
      ? { district: toNonEmptyString(district) }
      : {}),
    ...(toNonEmptyString(streetName)
      ? { streetName: toNonEmptyString(streetName) }
      : {}),
    ...(toNonEmptyString(buildingNumber)
      ? { buildingNumber: toNonEmptyString(buildingNumber) }
      : {}),
    ...(toNonEmptyString(floorNumber)
      ? { floorNumber: toNonEmptyString(floorNumber) }
      : {}),
    ...(toNonEmptyString(apartmentNumber)
      ? { apartmentNumber: toNonEmptyString(apartmentNumber) }
      : {}),
    ...(toNonEmptyString(closestLandmark)
      ? { closestLandmark: toNonEmptyString(closestLandmark) }
      : {}),
    ...(toNonEmptyString(furtherInstructions)
      ? { furtherInstructions: toNonEmptyString(furtherInstructions) }
      : {}),
    latitude,
    longitude,
  };
}

function toFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractSellerAddressesPayload(response) {
  const data = parseMaybeJson(response);
  return (
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.addresses) && data.addresses) ||
    (Array.isArray(data?.data) && data.data) ||
    (Array.isArray(data?.data?.addresses) && data.data.addresses) ||
    (Array.isArray(data?.data?.data) && data.data.data) ||
    (Array.isArray(data?.docs) && data.docs) ||
    []
  );
}

function normalizeSellerAddress(address, index) {
  const raw = address && typeof address === "object" ? address : {};

  const governorate =
    raw.governorate ||
    raw.Governorate ||
    raw.city ||
    raw.emirate ||
    raw.state ||
    "";
  const district =
    raw.district ||
    raw.area ||
    raw.region ||
    raw.zone ||
    raw.neighborhood ||
    "";
  const streetName = raw.streetName || raw.street || raw.road || "";
  const buildingNumber =
    raw.buildingNumber || raw.building || raw.houseNumber || raw.house || "";
  const floorNumber = raw.floorNumber || raw.floor || "";
  const apartmentNumber =
    raw.apartmentNumber || raw.apartment || raw.unit || "";

  const closestLandmark = raw.closestLandmark || raw.landmark || "";
  const furtherInstructions =
    raw.furtherInstructions ||
    raw.furtherInstruction ||
    raw.instructions ||
    raw.instruction ||
    raw.notes ||
    "";

  let lat = toFiniteNumber(
    raw.latitude ??
      raw.lat ??
      raw.location?.lat ??
      raw.location?.latitude ??
      raw.coords?.lat ??
      raw.coords?.latitude,
  );
  let lng = toFiniteNumber(
    raw.longitude ??
      raw.lng ??
      raw.location?.lng ??
      raw.location?.longitude ??
      raw.coords?.lng ??
      raw.coords?.longitude,
  );

  const coordsArray =
    (Array.isArray(raw.coordinates) && raw.coordinates) ||
    (Array.isArray(raw.location?.coordinates) && raw.location.coordinates) ||
    (Array.isArray(raw.location?.coords) && raw.location.coords) ||
    null;

  if (
    (!Number.isFinite(lat) || !Number.isFinite(lng)) &&
    coordsArray?.length >= 2
  ) {
    const maybeLng = toFiniteNumber(coordsArray[0]);
    const maybeLat = toFiniteNumber(coordsArray[1]);
    if (Number.isFinite(maybeLat) && Number.isFinite(maybeLng)) {
      lat = maybeLat;
      lng = maybeLng;
    }
  }

  const title =
    raw.title ||
    raw.label ||
    raw.name ||
    raw.type ||
    raw.addressName ||
    raw.addressLabel ||
    "Saved Address";

  const subtitle = [governorate, district, streetName]
    .filter(Boolean)
    .join(" - ");

  return {
    id: raw._id || raw.id || raw.addressId || raw.addressID || index,
    title,
    subtitle,
    governorate,
    district,
    streetName,
    buildingNumber,
    floorNumber,
    apartmentNumber,
    closestLandmark,
    furtherInstructions,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    raw,
  };
}

function extractShipmentHistoryPayload(response) {
  const data = parseMaybeJson(response);

  const container = data?.shipments?.shipments
    ? data.shipments
    : data?.data?.shipments?.shipments
      ? data.data.shipments
      : data?.data?.data?.shipments?.shipments
        ? data.data.data.shipments
        : data?.shipments && typeof data.shipments === "object"
          ? data.shipments
          : null;

  const shipments =
    (Array.isArray(container?.shipments) && container.shipments) ||
    (Array.isArray(data?.shipments) && data.shipments) ||
    (Array.isArray(data?.data?.shipments) && data.data.shipments) ||
    [];

  const meta = container
    ? {
        totalCount: container.totalCount,
        currentPage: container.currentPage,
        totalPages: container.totalPages,
      }
    : null;

  return { shipments, meta };
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

    recipient: {
      id: recipient.userId || recipient._id || recipient.id,
      name: getPersonName(recipient),
      phone: recipient.phone || recipient.whatsapp,
      whatsapp: recipient.whatsapp,
    },

    courier: raw.courier
      ? {
          id: courier.userId || courier._id || courier.id,
          name: getPersonName(courier),
          phone: courier.phone || courier.whatsapp,
        }
      : null,

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

    // Keep raw for emergency fallback
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

export default function HomeScreen() {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [activeSidebarKey, setActiveSidebarKey] = useState("new");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openDetailsPanel, setOpenDetailsPanel] = useState("pickup");
  const [searchValue, setSearchValue] = useState("");
  const [newShipmentTab, setNewShipmentTab] = useState("piece");
  const [shipmentValue, setShipmentValue] = useState("");
  const [confirmSize, setConfirmSize] = useState(false);
  const [fragile, setFragile] = useState(false);
  const [followUserLocation, setFollowUserLocation] = useState(true);
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [pickupGovernorate, setPickupGovernorate] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [dropoffDateTime, setDropoffDateTime] = useState("");
  const [dropoffGovernorate, setDropoffGovernorate] = useState("");
  const [dropoffInstructions, setDropoffInstructions] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientDialCode, setRecipientDialCode] = useState("+962");
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [paymentOtherAmount, setPaymentOtherAmount] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAcceptedTerms, setPaymentAcceptedTerms] = useState(false);
  const [paymentShippingPayer, setPaymentShippingPayer] = useState("");
  const [sellerAddresses, setSellerAddresses] = useState([]);
  const [sellerAddressesLoading, setSellerAddressesLoading] = useState(false);
  const [sellerAddressesError, setSellerAddressesError] = useState("");
  const sellerAddressesLoadedRef = useRef(false);
  const [pickupSavedAddress, setPickupSavedAddress] = useState(null);
  const [dropoffSavedAddress, setDropoffSavedAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState("");

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [paymentMethodsError, setPaymentMethodsError] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const addressesLoadedRef = useRef(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsError, setShipmentsError] = useState("");
  const shipmentsRequestedRef = useRef(false);
  const [pendingMapPan, setPendingMapPan] = useState(null);
  const [isMobileMapFullscreen, setIsMobileMapFullscreen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedBulkShipments, setParsedBulkShipments] = useState([]);

  const authPhoneNumber = useMemo(() => getAuthPhoneNumber(), []);
  const countryKey = useMemo(
    () => getCountryKeyFromPhoneNumber(authPhoneNumber),
    [authPhoneNumber],
  );
  const governorates = useMemo(
    () => getGovernoratesForCountry(countryKey),
    [countryKey],
  );
  const countryDefaults = useMemo(
    () => getCountryDefaults(countryKey),
    [countryKey],
  );

  useEffect(() => {
    const dialCode = parseDialCodeFromPhoneNumber(authPhoneNumber);
    if (dialCode) setRecipientDialCode(dialCode);
  }, [authPhoneNumber]);

  const selectedAddressLocation = useMemo(() => {
    const lat = selectedAddress?.latitude;
    const lng = selectedAddress?.longitude;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, [selectedAddress]);

  const handleUserMapInteraction = useCallback(
    () => setFollowUserLocation(false),
    [],
  );

  const {
    selectedId,
    setSelectedId,
    selectedShipment,
    isMapReady,
    setMode,
    mode,
    animateMapTo,
    draftPickupLocation,
    setDraftPickupLocation,
    draftDropoffLocation,
    setDraftDropoffLocation,
    clearDraftLocations,
  } = useHomeScreenLogic({
    mapRef,
    courierIcon,
    pickupIcon,
    dropoffIcon,
    addressDetailsLocation: selectedAddressLocation,
    shipments,
    followUserLocation,
    onUserMapInteraction: handleUserMapInteraction,
  });

  useEffect(() => {
    if (mode === "addressBook") {
      setFollowUserLocation(true);
      return;
    }
    if (
      mode === "newShipment" &&
      !draftPickupLocation &&
      !draftDropoffLocation
    ) {
      setFollowUserLocation(true);
    }
  }, [draftDropoffLocation, draftPickupLocation, mode]);

  const resetDraftShipment = useCallback(() => {
    setShipmentValue("");
    setConfirmSize(false);
    setFragile(false);
    setFollowUserLocation(true);
    setPickupDateTime("");
    setPickupGovernorate("");
    setPickupInstructions("");
    setDropoffDateTime("");
    setDropoffGovernorate("");
    setDropoffInstructions("");
    setRecipientName("");
    setRecipientPhone("");
    setRecipientDialCode(
      parseDialCodeFromPhoneNumber(authPhoneNumber) || "+962",
    );
    setCreatingShipment(false);
    setPaymentOtherAmount(false);
    setPaymentAmount("");
    setPaymentAcceptedTerms(false);
    setPaymentShippingPayer("");
    setSelectedPaymentMethodId(null);
    setPickupSavedAddress(null);
    setDropoffSavedAddress(null);
    clearDraftLocations();
    setPendingMapPan(null);
    setBulkFile(null);
    setParsedBulkShipments([]);
  }, [authPhoneNumber, clearDraftLocations, setPendingMapPan]);

  const buildVerificationLink = useCallback(() => {
    const sellerFirstName = profile?.firstName || "";
    const sellerLastName = profile?.lastName || "";
    const businessName = profile?.businessName || "";
    const avatar = profile?.avatar || null;
    const { firstName, lastName } = splitFullName(recipientName);

    const params = new URLSearchParams();
    params.set("name", `${firstName} ${lastName}`.trim());
    params.set("seller_name", `${sellerFirstName} ${sellerLastName}`.trim());
    if (businessName) params.set("business_name", businessName);
    params.set("fill_address", "false");
    if (paymentOtherAmount && paymentAmount) {
      params.set("first_payment", paymentAmount);
    }
    if (avatar) params.set("logo", avatar);

    return `https://khdoum-recipient-1.firebaseapp.com/welcome?${params.toString()}`;
  }, [profile, recipientName, paymentOtherAmount, paymentAmount]);

  const handleCreateShipment = useCallback(
    async (paymentMethodIdOverride) => {
      if (creatingShipment) return;

      // Use the override from checkout, or fall back to the stored state
      const paymentMethodId =
        paymentMethodIdOverride || selectedPaymentMethodId;

      const trimmedRecipientName = String(recipientName || "").trim();
      if (!trimmedRecipientName) {
        toast.warning("Please enter recipient name.");
        return;
      }

      const { firstName, lastName } = splitFullName(trimmedRecipientName);
      if (!firstName || !lastName) {
        toast.warning("Please enter recipient full name (first & last).");
        return;
      }

      const cleanedRecipientPhone = String(recipientPhone || "").replace(
        /\s+/g,
        "",
      );
      if (!cleanedRecipientPhone || cleanedRecipientPhone.length < 7) {
        toast.warning("Please enter a valid recipient phone number.");
        return;
      }

      if (!pickupDateTime || !dropoffDateTime) {
        toast.warning("Please choose pick-up and drop-off date & time.");
        return;
      }

      if (!pickupGovernorate || !dropoffGovernorate) {
        toast.warning("Please select pick-up and drop-off governorates.");
        return;
      }

      if (
        !draftPickupLocation ||
        !Number.isFinite(draftPickupLocation.lat) ||
        !Number.isFinite(draftPickupLocation.lng)
      ) {
        toast.warning("Please select the pick-up location on the map.");
        return;
      }

      if (
        !draftDropoffLocation ||
        !Number.isFinite(draftDropoffLocation.lat) ||
        !Number.isFinite(draftDropoffLocation.lng)
      ) {
        toast.warning("Please select the drop-off location on the map.");
        return;
      }

      const shipmentNumericValue = Number(shipmentValue);
      const safeShipmentValue = Number.isFinite(shipmentNumericValue)
        ? shipmentNumericValue
        : 0;
      if (newShipmentTab === "piece") {
        if (
          !Number.isFinite(shipmentNumericValue) ||
          shipmentNumericValue <= 0
        ) {
          toast.warning("Please enter a valid shipment value.");
          return;
        }
        if (!confirmSize) {
          toast.warning(
            "Please confirm that the shipment size is within limits.",
          );
          return;
        }
      }

      if (!paymentAcceptedTerms) {
        toast.warning("Please accept the terms and conditions.");
        return;
      }

      if (!paymentShippingPayer) {
        toast.warning("Please select who pays the shipping fees.");
        return;
      }

      if (paymentOtherAmount) {
        const remaining = Number(paymentAmount);
        if (!Number.isFinite(remaining) || remaining <= 0) {
          toast.warning("Please enter a valid remaining amount.");
          return;
        }
      }

      const sellerId = getAuthUserId() || getSellerIdFromProfile(profile);
      if (!sellerId) {
        toast.error("Missing seller id. Please log in again.");
        return;
      }

      setCreatingShipment(true);
      try {
        const whatsapp = `${recipientDialCode}${cleanedRecipientPhone}`;
        const recipientResponse = await createRecipient(
          sellerId,
          firstName,
          lastName,
          whatsapp,
        );
        const recipientId = extractRecipientId(recipientResponse);
        if (!recipientId) {
          throw new Error("Failed to create recipient (missing recipientId).");
        }

        // Build verification link (matches Flutter generateRecipientUrlLink)
        const longUrl = buildVerificationLink();
        let verificationLink = longUrl;
        try {
          const shortenResp = await fetch(
            `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`,
          );
          if (shortenResp.ok) {
            const shortened = await shortenResp.text();
            if (shortened && shortened.startsWith("http")) {
              verificationLink = shortened;
            }
          }
        } catch {
          // CORS or network error — fall back to long URL
          if (import.meta.env.DEV) {
            console.warn(
              "[ShipmentCreate] URL shortening failed, using full URL",
            );
          }
        }

        const pickupDate = splitDateTime(pickupDateTime);
        const dropoffDate = splitDateTime(dropoffDateTime);

        const pickupSource = pickupSavedAddress || {};
        const dropoffSource = dropoffSavedAddress || {};

        const shipmentBody = [
          {
            senderId: sellerId,
            recipientId,
            verificationLink,
            ...(paymentMethodId ? { paymentMethodId } : {}),
            shipmentValuePaid: !paymentOtherAmount,
            shipmentFeePaidBy: paymentShippingPayer,
            type: mapShipmentType(newShipmentTab),
            value: safeShipmentValue,
            isFragile: Boolean(fragile),
            pickUpDetails: {
              date: pickupDate.date,
              time: pickupDate.time,
              location: {
                ...buildLocationPayload({
                  governorate: pickupGovernorate,
                  district: pickupSource.district,
                  streetName: pickupSource.streetName,
                  buildingNumber: pickupSource.buildingNumber,
                  floorNumber: pickupSource.floorNumber,
                  apartmentNumber: pickupSource.apartmentNumber,
                  closestLandmark: pickupSource.closestLandmark,
                  furtherInstructions: pickupInstructions,
                  latitude: String(draftPickupLocation.lat),
                  longitude: String(draftPickupLocation.lng),
                }),
              },
            },
            dropOffDetails: {
              date: dropoffDate.date,
              time: dropoffDate.time,
              location: {
                ...buildLocationPayload({
                  governorate: dropoffGovernorate,
                  district: dropoffSource.district,
                  streetName: dropoffSource.streetName,
                  buildingNumber: dropoffSource.buildingNumber,
                  floorNumber: dropoffSource.floorNumber,
                  apartmentNumber: dropoffSource.apartmentNumber,
                  closestLandmark: dropoffSource.closestLandmark,
                  furtherInstructions: dropoffInstructions,
                  latitude: String(draftDropoffLocation.lat),
                  longitude: String(draftDropoffLocation.lng),
                }),
              },
            },
            paymentDetails: {
              ...(paymentOtherAmount
                ? { remainingAmount: Number(paymentAmount) || 0 }
                : {}),
              currency: "JOD",
            },
          },
        ];

        if (import.meta.env.DEV) {
          console.log(
            "[ShipmentCreate] shipmentBody:",
            JSON.stringify(shipmentBody, null, 2),
          );
        }

        const shipmentResponse = await createShipment(shipmentBody);

        const trackingIds = extractTrackingIds(shipmentResponse);
        if (trackingIds.length > 0) {
          Promise.allSettled(
            trackingIds.map((trackingId) =>
              updateTrackingStatus(trackingId, {
                status: "Shipment placed",
                location: "Warehouse A",
              }),
            ),
          )
            .then((results) => {
              if (!import.meta.env.DEV) return;
              results.forEach((result, index) => {
                if (result.status === "fulfilled") {
                  console.info(
                    `[ShipmentCreate] tracking status updated for ${trackingIds[index]}`,
                  );
                } else {
                  console.warn(
                    `[ShipmentCreate] tracking status update failed for ${trackingIds[index]}`,
                    result.reason,
                  );
                }
              });
            })
            .catch((error) => {
              if (import.meta.env.DEV) {
                console.warn(
                  "[ShipmentCreate] tracking status update request failed",
                  error,
                );
              }
            });
        } else if (import.meta.env.DEV) {
          console.warn(
            "[ShipmentCreate] No trackingId found in createShipment response; skipping updateTrackingStatus",
            shipmentResponse,
          );
        }

        toast.success("Shipment created successfully.");
        setActiveSidebarKey("all");
        resetDraftShipment();
        shipmentsRequestedRef.current = false;
        setMode("shipment");
      } catch (error) {
        const message = error?.message || "Failed to create shipment.";
        if (import.meta.env.DEV) {
          console.error("[ShipmentCreate] failed", error);
        }
        toast.error(message);
      } finally {
        setCreatingShipment(false);
      }
    },
    [
      buildVerificationLink,
      confirmSize,
      creatingShipment,
      draftDropoffLocation,
      draftPickupLocation,
      dropoffDateTime,
      dropoffGovernorate,
      dropoffInstructions,
      dropoffSavedAddress,
      fragile,
      newShipmentTab,
      paymentAcceptedTerms,
      paymentAmount,
      paymentOtherAmount,
      paymentShippingPayer,
      pickupDateTime,
      pickupGovernorate,
      pickupInstructions,
      pickupSavedAddress,
      profile,
      recipientDialCode,
      recipientName,
      recipientPhone,
      resetDraftShipment,
      selectedPaymentMethodId,
      setMode,
      shipmentValue,
      toast,
    ],
  );

  const handleNewShipmentNext = useCallback(async () => {
    if (newShipmentTab === "piece") {
      const value = Number(shipmentValue);
      if (!Number.isFinite(value) || value <= 0) {
        toast.warning("Please enter a valid shipment value.");
        return;
      }
      if (!confirmSize) {
        toast.warning(
          "Please confirm that the shipment size is within limits.",
        );
        return;
      }
      setMode("pickupDetails");
    } else if (newShipmentTab === "bulk") {
      if (!bulkFile) {
        toast.warning("Please upload a bulk shipment file first.");
        return;
      }
      try {
        const data = await bulkFile.arrayBuffer();
        const workbook = xlsx.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        // json[0] is header, rows start at 1
        const parsed = [];
        for (let i = 1; i < json.length; i++) {
          const row = json[i];
          // Skip completely empty rows
          if (!row || row.every(cell => String(cell).trim() === "")) continue;

          // Column 18: First Name, Column 19: Last Name
          const firstName = String(row[18] || "").trim();
          const lastName = String(row[19] || "").trim();
          const name = `${firstName} ${lastName}`.trim() || "Unknown Recipient";

          // Column 20: Phone/Whatsapp (Guessing index 20 based on proximity to name)
          const phone = String(row[20] || "").trim();

          // Column 22: Drop-off Governorate
          const city = String(row[22] || "").trim();

          // Column 0: Valid Value
          const value = String(row[0] || "0").trim();

          // Column 16: Drop-off Date
          let dateStr = String(row[16] || "").trim();
          
          parsed.push({ 
            firstName, 
            lastName, 
            name, 
            phone, 
            city, 
            value, 
            date: dateStr, 
            originalRowIndex: i 
          });
        }

        setParsedBulkShipments(parsed);
        setMode("bulkSummary");
      } catch (err) {
        toast.error("Failed to parse the uploaded file.");
        console.error(err);
      }
    }
  }, [confirmSize, newShipmentTab, setMode, shipmentValue, toast, bulkFile]);

  const handleBulkSubmit = useCallback(async () => {
    if (creatingShipment || parsedBulkShipments.length === 0) return;

    const sellerId = getAuthUserId() || getSellerIdFromProfile(profile);
    if (!sellerId) {
      toast.error("Missing seller id. Please log in again.");
      return;
    }

    setCreatingShipment(true);
    try {
      const shipmentBody = [];

      for (const item of parsedBulkShipments) {
        // 1. Create Recipient
        // Note: For production, we might want a bulk recipient API or handle this more efficiently.
        // For now, we follow the single-recipient-per-shipment pattern.
        const whatsapp = item.phone || "000000000"; // Fallback if missing
        const recipientResponse = await createRecipient(
          sellerId,
          item.firstName || item.name,
          item.lastName || "",
          whatsapp
        );
        const recipientId = extractRecipientId(recipientResponse);
        
        if (!recipientId) continue;

        // 2. Build Verification Link (Simple version for bulk)
        const params = new URLSearchParams();
        params.set("name", item.name);
        params.set("seller_name", `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim());
        params.set("fill_address", "false");
        const verificationLink = `https://khdoum-recipient-1.firebaseapp.com/welcome?${params.toString()}`;

        // 3. Add to body
        shipmentBody.push({
          senderId: sellerId,
          recipientId,
          verificationLink,
          shipmentValuePaid: true,
          shipmentFeePaidBy: "recipient",
          type: "Bulk",
          value: Number(item.value) || 0,
          isFragile: false,
          pickUpDetails: {
            date: splitDateTime(pickupDateTime).date,
            time: splitDateTime(pickupDateTime).time,
            location: {
              ...buildLocationPayload({
                governorate: pickupGovernorate,
                latitude: String(draftPickupLocation?.lat || 0),
                longitude: String(draftPickupLocation?.lng || 0),
              }),
            },
          },
          dropOffDetails: {
            date: item.date || splitDateTime(dropoffDateTime).date,
            time: splitDateTime(dropoffDateTime).time,
            location: {
              ...buildLocationPayload({
                governorate: item.city || dropoffGovernorate,
                latitude: "0",
                longitude: "0",
              }),
            },
          },
          paymentDetails: {
            currency: "JOD",
          },
        });
      }

      if (shipmentBody.length === 0) {
        throw new Error("No valid shipments could be created.");
      }

      const shipmentResponse = await createShipment(shipmentBody);
      const trackingIds = extractTrackingIds(shipmentResponse);

      toast.success(`Successfully created ${trackingIds.length} shipments.`);
      setActiveSidebarKey("all");
      resetDraftShipment();
      setMode("shipment");
    } catch (error) {
      toast.error(error?.message || "Failed to create bulk shipments.");
      console.error(error);
    } finally {
      setCreatingShipment(false);
    }
  }, [
    creatingShipment,
    parsedBulkShipments,
    profile,
    pickupDateTime,
    pickupGovernorate,
    draftPickupLocation,
    dropoffDateTime,
    dropoffGovernorate,
    resetDraftShipment,
    setMode,
    toast,
  ]);

  useEffect(() => {
    if (!pendingMapPan || !isMapReady) return;
    animateMapTo(pendingMapPan.center, { minZoom: pendingMapPan.minZoom });
    setPendingMapPan(null);
  }, [animateMapTo, isMapReady, pendingMapPan]);

  const selectedShipmentDetails = selectedShipment || null;
  const shipmentTimeline = useMemo(
    () => getShipmentTimeline(selectedShipmentDetails),
    [selectedShipmentDetails],
  );

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError("");
    try {
      const response = await getProfile();
      setProfile(extractProfile(response));
    } catch (error) {
      setProfileError(error?.message || "Failed to load profile.");
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadSellerAddresses = useCallback(async () => {
    let sellerId = getAuthUserId();

    if (!sellerId) {
      sellerId = getSellerIdFromProfile(profile);
    }
    if (!sellerId) {
      try {
        const response = await getProfile();
        const freshProfile = extractProfile(response);
        setProfile(freshProfile);
        sellerId = getSellerIdFromProfile(freshProfile);
      } catch {
        // ignore; will fail below
      }
    }

    if (!sellerId) {
      setSellerAddressesError("Missing seller id. Please log in again.");
      setSellerAddresses([]);
      sellerAddressesLoadedRef.current = false;
      return;
    }

    setSellerAddressesLoading(true);
    setSellerAddressesError("");
    try {
      const response = await getMyAddresses(sellerId);
      const list = extractSellerAddressesPayload(response);
      const normalized = list.map(normalizeSellerAddress);
      setSellerAddresses(normalized);
      sellerAddressesLoadedRef.current = true;

      if (import.meta.env.DEV) {
        console.log("[SellerAddresses] getMyAddresses success", {
          count: normalized.length,
          firstItemKeys: Object.keys(normalized[0] || {}),
        });
      }
    } catch (error) {
      setSellerAddressesError(
        error?.message || "Failed to load saved addresses.",
      );
      setSellerAddresses([]);
      sellerAddressesLoadedRef.current = false;
      if (import.meta.env.DEV) {
        console.error("[SellerAddresses] getMyAddresses failed", error);
      }
    } finally {
      setSellerAddressesLoading(false);
    }
  }, [profile]);

  const ensureSellerAddressesLoaded = useCallback(() => {
    if (sellerAddressesLoadedRef.current) return;
    if (sellerAddressesLoading) return;
    loadSellerAddresses();
  }, [loadSellerAddresses, sellerAddressesLoading]);

  const loadShipments = useCallback(
    async ({ page = 1, limit = 10 } = {}) => {
      let sellerId = getAuthUserId();

      if (!sellerId) {
        sellerId = getSellerIdFromProfile(profile);
      }
      if (!sellerId) {
        try {
          const response = await getProfile();
          const freshProfile = extractProfile(response);
          setProfile(freshProfile);
          sellerId = getSellerIdFromProfile(freshProfile);
        } catch {
          // ignore; will fail below
        }
      }

      if (!sellerId) {
        setShipmentsError("Missing seller id. Please log in again.");
        if (import.meta.env.DEV) {
          console.error("[Shipments] Missing sellerId (JWT + profile).");
        }
        return;
      }

      setShipmentsLoading(true);
      setShipmentsError("");
      try {
        const response = await getShipmentHistory(sellerId, { page, limit });
        const { shipments: items } = extractShipmentHistoryPayload(response);
        const normalized = items.map(normalizeShipment).filter(Boolean);
        setShipments(normalized);
      } catch (error) {
        setShipmentsError(error?.message || "Failed to load shipments.");
        setShipments([]);
      } finally {
        setShipmentsLoading(false);
      }
    },
    [profile],
  );

  const loadAddresses = useCallback(async () => {
    // Prefer the user id from the JWT (matches what you pass from Flutter).
    let sellerId = getAuthUserId();

    // Fallback: some backends only expose seller id via `/seller/profile`.
    if (!sellerId) {
      sellerId = getSellerIdFromProfile(profile);
    }
    if (!sellerId) {
      try {
        const response = await getProfile();
        const freshProfile = extractProfile(response);
        setProfile(freshProfile);
        sellerId = getSellerIdFromProfile(freshProfile);
      } catch {
        // ignore; will fail below
      }
    }

    if (!sellerId) {
      setAddressesError("Missing seller id. Please log in again.");
      addressesLoadedRef.current = false;
      if (import.meta.env.DEV) {
        console.error("[AddressBook] Missing sellerId (JWT + profile).");
      }
      return;
    }

    setAddressesLoading(true);
    setAddressesError("");
    try {
      if (import.meta.env.DEV) {
        console.log("[AddressBook] getAddresses start", {
          sellerId,
          page: 1,
          limit: 50,
        });
      }

      const response = await getAddresses(sellerId, { page: 1, limit: 50 });
      let data = response;
      if (typeof response === "string") {
        try {
          data = JSON.parse(response);
        } catch {
          data = response;
        }
      }

      const addressBook =
        (Array.isArray(data?.addressBook) && data.addressBook) ||
        (Array.isArray(data?.data?.addressBook) && data.data.addressBook) ||
        (Array.isArray(data?.data?.data?.addressBook) &&
          data.data.data.addressBook) ||
        null;

      const list = addressBook
        ? addressBook.map(normalizeAddressBookEntry)
        : (Array.isArray(data) && data) ||
          (Array.isArray(data?.data) && data.data) ||
          (Array.isArray(data?.data?.data) && data.data.data) ||
          (Array.isArray(data?.data?.docs) && data.data.docs) ||
          (Array.isArray(data?.data?.items) && data.data.items) ||
          (Array.isArray(data?.addresses) && data.addresses) ||
          (Array.isArray(data?.results) && data.results) ||
          (Array.isArray(data?.items) && data.items) ||
          [];
      setAddresses(list);
      addressesLoadedRef.current = true;

      if (import.meta.env.DEV) {
        console.log("[AddressBook] getAddresses success", {
          responseKeys: Object.keys(
            (data && typeof data === "object" && data) || {},
          ),
          count: list.length,
          firstItemKeys: Object.keys(list[0] || {}),
        });
      }
    } catch (error) {
      setAddressesError(error?.message || "Failed to load addresses.");
      addressesLoadedRef.current = false;
      if (import.meta.env.DEV) {
        console.error("[AddressBook] getAddresses failed", error);
      }
    } finally {
      setAddressesLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (mode !== "addressBook") return;
    loadAddresses();
  }, [mode, loadAddresses]);

  const ensureAddressBookLoaded = useCallback(() => {
    if (addresses.length === 0 && !addressesLoading && !addressesError) {
      loadAddresses();
    }
  }, [addresses.length, addressesLoading, addressesError, loadAddresses]);

  const loadPaymentMethods = useCallback(async () => {
    setPaymentMethodsLoading(true);
    setPaymentMethodsError("");
    try {
      let resp = await getPaymentMethods();
      console.log("PAYMENT_METHODS_RESP:", resp);

      if (typeof resp === "string") {
        try {
          resp = JSON.parse(resp);
        } catch (e) {
          console.error("Failed to parse payment methods response:", e);
        }
      }

      // The API might return { data: [...] }, { data: { docs: [...] } }, or just [...]
      const list =
        (Array.isArray(resp) && resp) ||
        (Array.isArray(resp?.data) && resp.data) ||
        (Array.isArray(resp?.data?.data) && resp.data.data) ||
        (Array.isArray(resp?.data?.docs) && resp.data.docs) ||
        (Array.isArray(resp?.docs) && resp.docs) ||
        (Array.isArray(resp?.paymentMethods) && resp.paymentMethods) ||
        (Array.isArray(resp?.data?.paymentMethods) &&
          resp.data.paymentMethods) ||
        (Array.isArray(resp?.cards) && resp.cards) ||
        (Array.isArray(resp?.data?.cards) && resp.data.cards) ||
        [];

      console.log("NORMALIZED_PAYMENT_METHODS_LIST:", list);
      setPaymentMethods(list);
    } catch (err) {
      console.error("Failed to load payment methods:", err);
      setPaymentMethodsError(err.message || "Failed to load payment methods.");
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "checkout") {
      loadPaymentMethods();
    }
  }, [mode, loadPaymentMethods]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (mode !== "shipment" && mode !== "shipmentDetails") return;
    if (shipmentsRequestedRef.current) return;
    shipmentsRequestedRef.current = true;
    loadShipments({ page: 1, limit: 10 });
  }, [mode, loadShipments]);

  useEffect(() => {
    if (mode !== "addressDetails") return;
    if (selectedAddress) return;
    setMode("addressBook");
  }, [mode, selectedAddress, setMode]);

  // Centralized mobile map reparenting — runs whenever mode changes
  useEffect(() => {
    if (window.innerWidth > 767) return;

    const mapEl = document.querySelector(".map-container");
    const fullscreenEl = document.querySelector(".map-fullscreen");
    if (!mapEl || !fullscreenEl) return;

    let targetId = null;
    if (!isMobileMapFullscreen) {
      if (mode === "pickupDetails") targetId = "pickup-mobile-map-target";
      else if (mode === "dropoffDetails")
        targetId = "dropoff-mobile-map-target";
      else if (mode === "shipmentDetails")
        targetId = "shipment-details-mobile-map-target";
    }

    if (targetId) {
      // Small delay to ensure the overlay DOM has rendered
      const timer = setTimeout(() => {
        const target = document.getElementById(targetId);
        if (target && !target.contains(mapEl)) {
          target.appendChild(mapEl);
        }
      }, 30);
      return () => {
        clearTimeout(timer);
        // Return map to fullscreen when leaving this mode
        if (mapEl && fullscreenEl && !fullscreenEl.contains(mapEl)) {
          fullscreenEl.insertBefore(mapEl, fullscreenEl.firstChild);
        }
      };
    } else {
      // Not a map step — ensure map is back in fullscreen
      if (!fullscreenEl.contains(mapEl)) {
        fullscreenEl.insertBefore(mapEl, fullscreenEl.firstChild);
      }
    }
  }, [mode, isMobileMapFullscreen]);

  const handleSidebarSelect = (key) => {
    setActiveSidebarKey(key);
    if (key === "logout") {
      clearAuth();
      navigate("/", { replace: true });
      return;
    }
    if (key === "book") {
      setMode("addressBook");
      return;
    }
    if (key === "new") {
      setMode("newShipment");
      return;
    }
    setMode("shipment");
  };

  const handleShipmentSelect = (shipmentId) => {
    setSelectedId(shipmentId);
    setMode("shipmentDetails");
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchValue(value);
    if (value.trim().toLowerCase().includes("new shipment")) {
      setActiveSidebarKey("new");
      setMode("newShipment");
    }
  };

  const detailsPanels = useMemo(() => {
    if (!selectedShipmentDetails) return [];

    const {
      pickup = {},
      dropoff = {},
      payment = {},
      recipient = {},
      courier = null,
      status = "",
      trackingId = "",
      type = "",
      value = "",
      updatedAt = "",
      notes = "",
    } = selectedShipmentDetails;

    const panels = [
      {
        key: "pickup",
        title: "Pick-Up Details",
        rows: [
          ["Pick-Up Governorate", pickup.governorate],
          ["Pick-Up Date", formatDateOnly(pickup.date)],
          ["Pick-Up Time", pickup.time],
        ],
        showMapLink: true,
      },
      {
        key: "shipment",
        title: "Shipment Details",
        rows: [
          ["Tracking ID", trackingId],
          ["Type", type],
          ["Value", value != null ? String(value) : ""],
          ["Status", status],
          ["Updated At", formatDateTime(updatedAt)],
          ["Notes", notes],
        ],
      },
      {
        key: "recipient",
        title: "Recipient Details",
        rows: [
          ["Name", recipient.name],
          ["Phone", recipient.phone],
          ["Whatsapp", recipient.whatsapp],
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
          ["Settlement Status", payment.settlementStatus],
        ],
      },
      {
        key: "dropoff",
        title: "Drop-Off Details",
        rows: [
          ["Recipient First Name", splitFullName(recipient.name).firstName],
          ["Recipient Last Name", splitFullName(recipient.name).lastName],
          ["Recipient Whatsapp", recipient.whatsapp],
          ["Drop-Off Governorate", dropoff.governorate],
          ["Drop-Off Date", formatDateOnly(dropoff.date)],
          ["Drop-Off Time", dropoff.time],
        ],
      },
    ];

    if (courier) {
      panels.splice(2, 0, {
        key: "courier",
        title: "Courier Details",
        rows: [
          ["Name", courier.name],
          ["Phone", courier.phone],
        ],
      });
    }

    return panels;
  }, [selectedShipmentDetails]);

  const isShipmentStep = [
    "newShipment",
    "pickupDetails",
    "paymentDetails",
    "dropoffDetails",
    "checkout",
    "addCard",
  ].includes(mode);

  // Modes that render a full-screen panel — the map must not capture any clicks.
  // ⚠️ Do NOT include pickupDetails / dropoffDetails here — those modes
  // require the user to click the map to set a location.
  const isOverlayMode = [
    "newShipment",
    "paymentDetails",
    "checkout",
    "addCard",
  ].includes(mode);

  // Initialise the Stripe instance once — keep it outside render to avoid
  // recreating it on every render (loadStripe memoises internally).
  const stripePromise = useMemo(
    () => loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""),
    [],
  );

  return (
    <div className="home-container">
      <button
        className="mobile-menu-btn"
        onClick={() => setIsSidebarOpen(true)}
      >
        <span style={{ fontSize: "24px" }}>☰</span>
      </button>

      <Sidebar
        activeKey={activeSidebarKey}
        onSelect={handleSidebarSelect}
        profile={profile}
        profileLoading={profileLoading}
        profileError={profileError}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="map-fullscreen">
        <div
          className="map-container"
          ref={mapRef}
          style={isOverlayMode ? { pointerEvents: "none" } : undefined}
        >
          {!isMapReady && <p>Loading Map...</p>}
        </div>

        {/* Search Bar — hidden on mobile as it is integrated into observers */}
        {mode !== "shipmentDetails" && !isShipmentStep && (
          <div className="search-bar-floating desktop-only-ui">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Phone Number, Or Recipient's Name"
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
        )}

        {mode === "newShipment" ? (
          <NewShipmentOverlay
            onBack={() => {
              setActiveSidebarKey("all");
              resetDraftShipment();
              setMode("shipment");
            }}
            onNext={handleNewShipmentNext}
            newShipmentTab={newShipmentTab}
            onTabChange={setNewShipmentTab}
            shipmentValue={shipmentValue}
            onShipmentValueChange={(event) =>
              setShipmentValue(event.target.value)
            }
            confirmSize={confirmSize}
            onConfirmSizeChange={(event) =>
              setConfirmSize(event.target.checked)
            }
            fragile={fragile}
            onFragileChange={(event) => setFragile(event.target.checked)}
            bulkFile={bulkFile}
            onBulkFileChange={setBulkFile}
          />
        ) : mode === "pickupDetails" ? (
          <NewShipmentPickup
            onBack={() => setMode("newShipment")}
            onNext={() => setMode("paymentDetails")}
            governorates={governorates}
            pickupDateTime={pickupDateTime}
            onPickupDateTimeChange={setPickupDateTime}
            governorate={pickupGovernorate}
            onGovernorateChange={(gov) => {
              setPickupGovernorate(gov);
              setFollowUserLocation(false);
            }}
            instructions={pickupInstructions}
            onInstructionsChange={setPickupInstructions}
            pickupLocation={draftPickupLocation}
            savedAddresses={sellerAddresses}
            savedAddressesLoading={sellerAddressesLoading}
            savedAddressesError={sellerAddressesError}
            onSavedAddressesOpen={ensureSellerAddressesLoaded}
            onSavedAddressesRetry={loadSellerAddresses}
            selectedSavedAddress={pickupSavedAddress}
            onSelectSavedAddress={(address) => {
              setPickupSavedAddress(address);
              setFollowUserLocation(false);
              if (address?.governorate) {
                setPickupGovernorate(address.governorate);
              }
              if (!pickupInstructions && address?.furtherInstructions) {
                setPickupInstructions(address.furtherInstructions);
              }

              if (address?.lat != null && address?.lng != null) {
                const center = { lat: address.lat, lng: address.lng };
                setDraftPickupLocation(center);
                if (!isMapReady) {
                  setPendingMapPan({ center, minZoom: 15 });
                  return;
                }
                animateMapTo(center, { minZoom: 15 });
              }
            }}
            onGovernorateSelect={(gov) => {
              const center = getGovernorateCenter(countryKey, gov);
              if (center && !isMapReady) {
                setPendingMapPan({
                  center,
                  minZoom: countryDefaults?.minZoom,
                });
                setFollowUserLocation(false);
                return;
              }
              if (center) {
                setFollowUserLocation(false);
                animateMapTo(center, { minZoom: countryDefaults?.minZoom });
              }
            }}
            isMobileMapFullscreen={isMobileMapFullscreen}
            onSetLocationClick={() => setIsMobileMapFullscreen(true)}
          />
        ) : mode === "paymentDetails" ? (
          <NewShipmentPayment
            onBack={() => setMode("pickupDetails")}
            onNext={() => setMode("dropoffDetails")}
            otherAmount={paymentOtherAmount}
            onOtherAmountChange={setPaymentOtherAmount}
            amount={paymentAmount}
            onAmountChange={setPaymentAmount}
            acceptedTerms={paymentAcceptedTerms}
            onAcceptedTermsChange={setPaymentAcceptedTerms}
            shippingPayer={paymentShippingPayer}
            onShippingPayerChange={setPaymentShippingPayer}
          />
        ) : mode === "dropoffDetails" ? (
          <NewShipmentDropoff
            onBack={() => setMode("paymentDetails")}
            onNext={() => {
              if (paymentShippingPayer === "me") {
                setMode("checkout");
              } else {
                handleCreateShipment();
              }
            }}
            governorates={governorates}
            dropoffDateTime={dropoffDateTime}
            onDropoffDateTimeChange={setDropoffDateTime}
            governorate={dropoffGovernorate}
            onGovernorateChange={(gov) => {
              setDropoffGovernorate(gov);
              setFollowUserLocation(false);
            }}
            recipientName={recipientName}
            onRecipientNameChange={setRecipientName}
            recipientPhone={recipientPhone}
            recipientDialCode={recipientDialCode}
            onRecipientPhoneChange={({ phone, dialCode } = {}) => {
              if (typeof phone === "string") setRecipientPhone(phone);
              if (typeof dialCode === "string" && dialCode.trim()) {
                setRecipientDialCode(dialCode.trim());
              }
            }}
            submitting={creatingShipment}
            instructions={dropoffInstructions}
            onInstructionsChange={setDropoffInstructions}
            dropoffLocation={draftDropoffLocation}
            savedAddresses={addresses}
            savedAddressesLoading={addressesLoading}
            savedAddressesError={addressesError}
            onSavedAddressesOpen={ensureAddressBookLoaded}
            onSavedAddressesRetry={loadAddresses}
            selectedSavedAddress={dropoffSavedAddress}
            onSelectSavedAddress={(address) => {
              setDropoffSavedAddress(address);
              setFollowUserLocation(false);
              if (address?.governorate) {
                setDropoffGovernorate(address.governorate);
              }
              if (!dropoffInstructions && address?.furtherInstructions) {
                setDropoffInstructions(address.furtherInstructions);
              }
              if (address?.name) {
                setRecipientName(address.name);
              }

              const candidate =
                address?.whatsappNumber || address?.phoneNumber || "";
              const raw = String(candidate || "")
                .trim()
                .replace(/\s+/g, "");
              const dial = parseDialCodeFromPhoneNumber(raw);
              if (dial) {
                setRecipientDialCode(dial);
                setRecipientPhone(raw.slice(dial.length));
              } else if (raw) {
                setRecipientPhone(raw);
              }

              const lat = address?.lat ?? address?.latitude;
              const lng = address?.lng ?? address?.longitude;

              if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const center = { lat, lng };
                setDraftDropoffLocation(center);
                if (!isMapReady) {
                  setPendingMapPan({ center, minZoom: 15 });
                  return;
                }
                animateMapTo(center, { minZoom: 15 });
              }
            }}
            onGovernorateSelect={(gov) => {
              const center = getGovernorateCenter(countryKey, gov);
              if (center && !isMapReady) {
                setPendingMapPan({
                  center,
                  minZoom: countryDefaults?.minZoom,
                });
                setFollowUserLocation(false);
                return;
              }
              if (center) {
                setFollowUserLocation(false);
                animateMapTo(center, { minZoom: countryDefaults?.minZoom });
              }
            }}
            isMobileMapFullscreen={isMobileMapFullscreen}
            onSetLocationClick={() => setIsMobileMapFullscreen(true)}
          />
        ) : mode === "bulkSummary" ? (
          <NewShipmentBulkSummary
            shipments={parsedBulkShipments}
            onBack={() => setMode("newShipment")}
            onSubmit={handleBulkSubmit}
            submitting={creatingShipment}
          />
        ) : mode === "checkout" ? (
          <NewShipmentCheckout
            onBack={() => setMode("dropoffDetails")}
            onConfirm={handleCreateShipment}
            onAddCard={() => setMode("addCard")}
            userName={getPersonName(profile)}
            recipientName={recipientName}
            cards={paymentMethods}
            loadingCards={paymentMethodsLoading}
            errorCards={paymentMethodsError}
            onRetryCards={loadPaymentMethods}
            submitting={creatingShipment}
          />
        ) : mode === "addCard" ? (
          <Elements stripe={stripePromise}>
            <AddCardOverlay
              onBack={() => setMode("checkout")}
              onCardAdded={async () => {
                // Refresh card list, then go back to checkout
                await loadPaymentMethods();
                setMode("checkout");
              }}
            />
          </Elements>
        ) : mode === "addressBook" ? (
          <HomeAddressBook
            addresses={addresses}
            loading={addressesLoading}
            error={addressesError}
            onRetry={loadAddresses}
            onSelect={(address) => {
              setSelectedAddress(address);
              setMode("addressDetails");
            }}
            searchValue={searchValue}
          />
        ) : mode === "addressDetails" ? (
          <HomeAddressDetails
            address={selectedAddress}
            onBack={() => setMode("addressBook")}
          />
        ) : mode === "shipmentDetails" ? (
          <HomeShipmentDetails
            detailsPanels={detailsPanels}
            openDetailsPanel={openDetailsPanel}
            onTogglePanel={(panelKey) =>
              setOpenDetailsPanel((current) =>
                current === panelKey ? "" : panelKey,
              )
            }
            timeline={shipmentTimeline}
            recipientPhone={selectedShipmentDetails?.recipient?.phone}
            courierPhone={selectedShipmentDetails?.courier?.phone}
            onBack={() => setMode("shipment")}
          />
        ) : (
          <HomeShipments
            shipments={shipments}
            loading={shipmentsLoading}
            error={shipmentsError}
            onRetry={() => loadShipments({ page: 1, limit: 10 })}
            selectedId={selectedId}
            onSelect={handleShipmentSelect}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
          />
        )}
      </main>

      {isMobileMapFullscreen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <div
            className="mobile-map-fullscreen-hint"
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#df2429",
              color: "white",
              padding: "12px 24px",
              borderRadius: "30px",
              fontSize: "1rem",
              fontWeight: "500",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            Tap in Map to Set Location
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "20px",
              right: "20px",
              pointerEvents: "auto",
            }}
          >
            <button
              className="new-shipment-next"
              onClick={() => setIsMobileMapFullscreen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
