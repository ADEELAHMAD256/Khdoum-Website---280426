// src/api_services/authApi.js
import { apiFetch } from "./apiClient";

const BASE_URL = "https://f5vaidgazm.eu-west-2.awsapprunner.com/api";
const BASE_URL_SELLER = `${BASE_URL}/seller`;

export const logIn = async (phoneNumber, pin, financialPhone, deviceToken) => {
  const payload = {
    phone: phoneNumber,
    pin,
    employee: Boolean(financialPhone),
    ...(deviceToken && { deviceToken }),
  };

  try {
    return await apiFetch(`${BASE_URL_SELLER}/sign-in`, {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    console.error("API ERROR:", error.message);
    throw error;
  }
};
