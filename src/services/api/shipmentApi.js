import { apiFetch } from "./apiClient";
import { getAuthUserId } from "../auth/authStorage";

const BASE_URL = "https://f5vaidgazm.eu-west-2.awsapprunner.com/api";

export async function getShipmentHistory(
  sellerId,
  { page = 1, limit = 10 } = {},
) {
  const resolvedSellerId = sellerId || getAuthUserId();
  if (!resolvedSellerId) throw new Error("Missing sellerId");

  const url = `${BASE_URL}/shipment/${resolvedSellerId}/shipments?page=${page}&limit=${limit}`;
  return apiFetch(url, { method: "GET" });
}

export async function getShipmentById(shipmentId) {
  if (!shipmentId) throw new Error("Missing shipmentId");
  return apiFetch(`${BASE_URL}/shipment/${shipmentId}`, { method: "GET" });
}

export async function createShipment(shipments) {
  if (!Array.isArray(shipments)) {
    throw new Error("createShipment expects a list payload");
  }
  return apiFetch(`${BASE_URL}/shipment/create`, {
    method: "POST",
    body: shipments,
  });
}

export async function updateTrackingStatus(
  trackingId,
  { status = "Shipment placed", location = "Warehouse A", reason } = {},
) {
  const resolvedTrackingId = String(trackingId || "").trim();
  if (!resolvedTrackingId) throw new Error("Missing trackingId");

  const payload = {
    status,
    location,
    ...(reason ? { reason } : {}),
  };

  return apiFetch(
    `${BASE_URL}/shipment/update-tracking-status/${encodeURIComponent(
      resolvedTrackingId,
    )}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}
