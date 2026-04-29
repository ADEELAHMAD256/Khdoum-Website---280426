import { apiFetch } from "./apiClient";
import { getAuthUserId } from "../auth/authStorage";

const BASE_URL = "https://f5vaidgazm.eu-west-2.awsapprunner.com/api";

export async function createRecipient(
  sellerId,
  firstName,
  lastName,
  whatsapp,
) {
  const resolvedSellerId = sellerId || getAuthUserId();
  if (!resolvedSellerId) throw new Error("Missing sellerId");

  return apiFetch(`${BASE_URL}/recipient/`, {
    method: "POST",
    body: {
      sellerId: resolvedSellerId,
      firstName,
      lastName,
      whatsapp,
    },
  });
}

