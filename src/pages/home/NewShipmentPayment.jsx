import CustomText from "../../components/CustomText";
import CustomCheckBox from "../../components/CustomCheckBox";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import { useToast } from "../../components/Toast/useToast";

export default function NewShipmentPayment({
  onBack,
  onNext,
  otherAmount = false,
  onOtherAmountChange,
  amount = "",
  onAmountChange,
  acceptedTerms = false,
  onAcceptedTermsChange,
  shippingPayer = "",
  onShippingPayerChange,
  shipmentValue = 0,
}) {
  const toast = useToast();

  const numAmount = Number(amount);
  const isInvalidAmount =
    otherAmount && amount !== "" && (numAmount <= 0 || isNaN(numAmount));
  const isAmountTooHigh =
    otherAmount && amount !== "" && numAmount > shipmentValue;

  const handleNext = () => {
    if (!acceptedTerms) {
      toast.warning("Please accept the terms and conditions.");
      return;
    }

    if (!shippingPayer) {
      toast.warning("Please select who pays the shipping fees.");
      return;
    }

    if (otherAmount) {
      if (!amount || isInvalidAmount) {
        toast.warning("Please enter a valid remaining amount.");
        return;
      }
      if (isAmountTooHigh) {
        toast.warning(
          `The amount cannot exceed the shipment value (JD ${shipmentValue}).`,
        );
        return;
      }
    }

    onNext?.();
  };

  return (
    <div className="payment-details-overlay">
      <div className="payment-details-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back to pick-up details"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <CustomText size="16px" weight="700">
          Payment Details
        </CustomText>
      </div>

      <div className="payment-section">
        <CustomText size="13px" weight="600">
          Are there any other amounts for your recipient to pay upon delivery?
        </CustomText>
        <div className="payment-toggle">
          <button
            type="button"
            className={`payment-pill ${otherAmount ? "active" : ""}`}
            onClick={() => onOtherAmountChange?.(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`payment-pill ${!otherAmount ? "active" : ""}`}
            onClick={() => {
              onOtherAmountChange?.(false);
              onAmountChange?.("");
            }}
          >
            No
          </button>
        </div>
      </div>

      {otherAmount && (
        <div className="payment-section">
          <CustomText size="13px" weight="600">
            How much is the amount? (In JOD)
          </CustomText>
          <div className="new-shipment-input-wrap">
            <input
              className={`payment-amount-input ${isInvalidAmount || isAmountTooHigh ? "error" : ""
                }`}
              type="number"
              placeholder="0.0 JOD"
              value={amount}
              onChange={(event) => onAmountChange?.(event.target.value)}
            />
            {(isInvalidAmount || isAmountTooHigh) && (
              <span className="new-shipment-input-icon">!</span>
            )}
          </div>
          {isInvalidAmount && (
            <span className="new-shipment-error-text">
              Value must be greater than zero
            </span>
          )}
          {isAmountTooHigh && !isInvalidAmount && (
            <span className="new-shipment-error-text">
              Amount cannot exceed shipment value (JD {shipmentValue})
            </span>
          )}
          <div className="payment-helper">
            1. Payments that your recipient pays by card are subjected to the
            service provider fees JD 0.20 + 2.9%
          </div>
        </div>
      )}

      <div className="payment-section">
        <CustomCheckBox
          value={acceptedTerms}
          onChange={(event) => onAcceptedTermsChange?.(event.target.checked)}
          label={
            <>
              I accept all the{" "}
              <span className="payment-terms">terms and conditions</span> of
              using the services
            </>
          }
        />
      </div>

      <div className="payment-section">
        <CustomText size="13px" weight="600">
          Who is paying the shipping fees?
        </CustomText>
        <div
          className={`payment-toggle payment-toggle-light ${shippingPayer ? "is-selected" : ""
            }`}
        >
          <button
            type="button"
            className={`payment-pill ${shippingPayer === "me" ? "active" : ""}`}
            onClick={() => onShippingPayerChange?.("me")}
          >
            Me
          </button>
          <button
            type="button"
            className={`payment-pill ${shippingPayer === "recipient" ? "active" : ""
              }`}
            onClick={() => onShippingPayerChange?.("recipient")}
          >
            Recipient
          </button>
        </div>
      </div>

      <div className="payment-summary">
        The amount you&apos;ll receive is JOD 0
      </div>

      <div className="payment-footer">
        <button className="new-shipment-next" type="button" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
