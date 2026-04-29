import { apiFetch } from "./apiClient";
import { getAuthUserId } from "../auth/authStorage";

const BASE_URL = "https://f5vaidgazm.eu-west-2.awsapprunner.com/api";
const BASE_URL_SELLER = `${BASE_URL}/seller`;

export async function getProfile() {
  return apiFetch(`${BASE_URL_SELLER}/profile`, { method: "GET" });
}

export async function getMyAddresses(sellerId) {
  const resolvedSellerId = sellerId || getAuthUserId();
  if (!resolvedSellerId) throw new Error("Missing sellerId");

  return apiFetch(`${BASE_URL_SELLER}/${resolvedSellerId}/addresses`, {
    method: "GET",
  });
}

export async function getPaymentMethods() {
  return apiFetch(`${BASE_URL_SELLER}/get-payment-methods`, {
    method: "GET",
  });
}

export async function createSetupIntent() {
  return apiFetch(`${BASE_URL_SELLER}/create-setup-intent`, {
    method: "POST",
  });
}

export async function savePaymentMethod(paymentMethodId) {
  return apiFetch(`${BASE_URL_SELLER}/save-payment-method`, {
    method: "POST",
    body: { paymentMethodId },
  });
}
