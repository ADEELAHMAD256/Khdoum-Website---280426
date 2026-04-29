import { apiFetch } from "./apiClient";
import { getAuthUserId } from "../auth/authStorage";

const BASE_URL = "https://f5vaidgazm.eu-west-2.awsapprunner.com/api";

export async function getAddresses(sellerId, { page = 1, limit = 10 } = {}) {
  const resolvedSellerId = sellerId || getAuthUserId();
  if (!resolvedSellerId) throw new Error("Missing sellerId");

  const url = `${BASE_URL}/address/book/${resolvedSellerId}?page=${page}&limit=${limit}`;
  return apiFetch(url, { method: "GET" });
}
