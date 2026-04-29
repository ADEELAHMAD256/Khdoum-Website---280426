import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PinCodeWidget from "./PinCodeWidget";
import "./PinCodeWidget.css";
import { usePinCodeLogic } from "./hooks/usePinLogic";
import { saveAuth } from "../../../services/auth/authStorage";
import { useToast } from "../../../components/Toast/useToast";

export default function PinCodeScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // ✅ Pull phone and flag from router state
  const phoneNumber = location.state?.phoneNumber;
  const useAsFinancialPhone = location.state?.useAsFinancialPhone || false;

  const pinLength = 4;
  const [pinDigits, setPinDigits] = useState(Array(pinLength).fill(""));
  const [pinValue, setPinValue] = useState("");

  useEffect(() => {
    // If the user refreshes this page, router state will be lost.
    if (!phoneNumber) {
      navigate("/", { replace: true });
    }
  }, [phoneNumber, navigate]);

  const goHome = () => navigate("/home", { replace: true });

  const { handleLogin } = usePinCodeLogic({
    phoneNumber,
    pin: pinValue,
    useAsFinancialPhone,
    onSuccess: (data) => {
      // Persist the token so the user stays logged in after refresh.
      console.log("🔑 [Auth] User Token:", data?.token);
      console.log("🆔 [Auth] Seller ID:", data?.employee?._id || data?.employee?.id);
      saveAuth({ token: data?.token, employee: data?.employee, phoneNumber });
      goHome();
    },
    onError: (message) => {
      console.error("❌ [PinCodeScreen] Login failed:", message);
      toast.error(message);
    },
  });

  const handleClear = () => {
    console.log("🔄 [PinCodeScreen] Clearing PIN");
    setPinValue("");
    setPinDigits(Array(pinLength).fill(""));
  };

  const handleComplete = (val) => {
    console.log("📥 [PinCodeScreen] PIN complete:", val);
    setPinValue(val);
    const arr = val.split("");
    while (arr.length < pinLength) arr.push("");
    setPinDigits(arr);
  };

  const handleNext = () => {
    console.log("➡️ [PinCodeScreen] handleNext called");
    if (pinValue.length !== pinLength) {
      toast.warning("Please enter a 4-digit PIN");
      return;
    }

    handleLogin(); // ✅ Call API
  };

  return (
    <div className="pin-screen">
      <PinCodeWidget
        title="Enter Your PIN"
        hintText="Please enter your 4‑digit PIN"
        pinLength={pinLength}
        pinDigits={pinDigits}
        onClear={handleClear}
        onComplete={handleComplete}
        onNext={handleNext}
      />
    </div>
  );
}
