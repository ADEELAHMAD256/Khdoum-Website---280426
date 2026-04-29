import { logIn } from "../../../../services/api/authApi";
import { isValidPhoneNumber } from "../../../../utils/utils";

export const usePinCodeLogic = ({
  phoneNumber,
  pin,
  useAsFinancialPhone,
  onSuccess,
  onError,
}) => {
  const handleLogin = async () => {
    const trimmedPhone = phoneNumber?.trim();
    const fullPhone = trimmedPhone;
    const deviceToken = "web-client";

    if (!trimmedPhone || !pin) {
      onError("Missing phone number or PIN");
      return;
    }

    const valid = isValidPhoneNumber(trimmedPhone);
    if (!valid) {
      onError("Invalid phone number");
      return;
    }

    try {
      const response = await logIn(
        fullPhone,
        pin,
        useAsFinancialPhone,
        deviceToken,
      );
      onSuccess(response);
    } catch (err) {
      console.error("❌ API Error:", err);
      onError(err.message || "Login failed");
    }
  };

  return { handleLogin };
};
