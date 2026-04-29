import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isValidPhoneNumber } from "../../../../utils/utils";
import { getAuthToken } from "../../../../services/auth/authStorage";
import { useToast } from "../../../../components/Toast/useToast";

export const useSignInLogic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // ✅ Always call hooks top-level
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState("+962");
  const [useAsFinancialPhone, setUseAsFinancialPhone] = useState(false);

  // ✅ Do not call hooks inside if-blocks
  useEffect(() => {
    if (getAuthToken()) {
      navigate("/home", { replace: true });
      return;
    }
    if (location.state?.suspended) {
      toast.error("Something went wrong. Please contact support.");
    }
  }, [location.state, navigate, toast]);

  const handleSignIn = async () => {
    const trimmedPhone = phone.trim();
    const fullPhone = `${dialCode}${trimmedPhone}`;

    if (!trimmedPhone) {
      toast.warning("Please enter the phone number");
      return;
    }

    if (!isValidPhoneNumber(trimmedPhone, dialCode)) {
      toast.warning("Enter a valid phone number");
      return;
    }

    try {
      navigate("/pin", {
        state: {
          navigateFrom: "Sign in",
          phoneNumber: fullPhone, // Full number with country code
          useAsFinancialPhone,
        },
      });
    } catch (error) {
      toast.error(`Login failed: ${error.message}`);
    }
  };

  return {
    phone,
    setPhone,
    dialCode,
    setDialCode,
    useAsFinancialPhone,
    toggleUseAsFinancialPhone: () => setUseAsFinancialPhone((prev) => !prev),
    handleSignIn,
    navigate,
  };
};
