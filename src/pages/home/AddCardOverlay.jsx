import React, { useState } from "react";
import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import CustomText from "../../components/CustomText";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import { createSetupIntent, savePaymentMethod } from "../../services/api/sellerApi";
import "./AddCardOverlay.css";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#111",
      fontFamily: "'Inter', 'Outfit', sans-serif",
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#adb5bd",
      },
    },
    invalid: {
      color: "#df2429",
      iconColor: "#df2429",
    },
  },
  hidePostalCode: true,
};

export default function AddCardOverlay({ onBack, onCardAdded }) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !cardComplete) return;

    setLoading(true);
    setError("");

    try {
      // Step 1: Create a SetupIntent on the backend
      console.log("🔵 [AddCard] Step 1 – calling createSetupIntent...");
      const intentData = await createSetupIntent();
      console.log("🔵 [AddCard] Step 1 – raw intentData:", intentData);

      // The API might return { clientSecret: "..." } or { data: { clientSecret: "..." } }
      const clientSecret =
        intentData?.clientSecret ||
        intentData?.data?.clientSecret ||
        intentData?.client_secret ||
        intentData?.data?.client_secret ||
        intentData?.setupIntent?.client_secret ||
        intentData?.data?.setupIntent?.client_secret;

      console.log("🔵 [AddCard] Step 1 – extracted clientSecret:", clientSecret);

      if (!clientSecret) {
        throw new Error(
          `Unable to create setup intent. API returned: ${JSON.stringify(intentData)}`
        );
      }

      // Step 2: Confirm the card setup with Stripe
      console.log("🔵 [AddCard] Step 2 – calling stripe.confirmCardSetup...");
      const cardElement = elements.getElement(CardElement);
      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      console.log("🔵 [AddCard] Step 2 – setupIntent:", setupIntent);
      console.log("🔵 [AddCard] Step 2 – stripeError:", stripeError);

      if (stripeError) {
        throw new Error(
          stripeError.message || "Card verification failed. Please check your details."
        );
      }

      if (!setupIntent?.payment_method) {
        throw new Error("Failed to retrieve payment method. Please try again.");
      }

      // Step 3: Save the payment method ID to our backend
      console.log("🔵 [AddCard] Step 3 – saving paymentMethodId:", setupIntent.payment_method);
      await savePaymentMethod(setupIntent.payment_method);

      // Step 4: Show success state briefly then navigate back
      setSuccess(true);
      setTimeout(() => {
        onCardAdded?.();
      }, 800);
    } catch (err) {
      console.error("❌ [AddCard] Error:", err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-card-overlay">
      {/* Header */}
      <div className="add-card-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back"
          disabled={loading}
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <div className="add-card-title-container">
          <CustomText size="18px" weight="700">
            Add New Card
          </CustomText>
          <CustomText size="13px" weight="500" color="#6f6f6f">
            Secured by Stripe
          </CustomText>
        </div>
        {/* Stripe badge */}
        <div className="add-card-stripe-badge">
          <svg viewBox="0 0 60 25" width="44" aria-label="Stripe">
            <path
              d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V6.27h3.64l.15 1.02a4.29 4.29 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 6.9-5.6 6.9zM40 9.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57c-1.44 0-2.38 1.13-2.38 1.13V6.27H22l.01 19.98 4.04-.86v-5.38c.4.34 1.14.79 2.21.79 2.47 0 5.36-1.44 5.36-7.32 0-5.28-2.9-7.91-5.38-7.91zm-.95 11.84c-.95 0-1.5-.37-1.92-.8v-6.04c.43-.5 1-.8 1.92-.8 1.44 0 2.45 1.62 2.45 3.83 0 2.2-1.01 3.81-2.45 3.81zM13.01 5.57c1.01 0 2.07.32 2.91 1.13l.13-.9h3.62v14.17H16l-.16-1.08a4.3 4.3 0 01-2.89 1.3c-2.9 0-4.9-2.07-4.9-5.58V6.27h4.12v8.19c0 1.76.8 2.5 1.84 2.5zM4.37 13.97L4.3 6.27H.1l.07 7.7c0 2.58 1.3 5.75 5.37 5.75 1.75 0 3.07-.73 3.88-1.94l.13 1.72h3.57V6.27H9.06v8.18c0 1.77-.8 2.52-1.88 2.52-1.03 0-1.54-.7-1.54-1.56v-.84l-.02-.6z"
              fill="#635BFF"
            />
          </svg>
        </div>
      </div>

      {/* Card illustration */}
      <div className="add-card-illustration">
        <div className="card-visual">
          <div className="card-visual-chip" />
          <div className="card-visual-number">•••• •••• •••• ••••</div>
          <div className="card-visual-footer">
            <span className="card-visual-label">Card Holder</span>
            <span className="card-visual-label">Expires</span>
          </div>
          <div className="card-visual-footer">
            <span className="card-visual-value">Your Name</span>
            <span className="card-visual-value">MM / YY</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form className="add-card-form" onSubmit={handleSubmit}>
        <div className="add-card-field-wrapper">
          <label className="add-card-field-label">Card Details</label>
          <div className="add-card-stripe-field">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) setError(e.error.message);
                else setError("");
              }}
            />
          </div>
        </div>

        {error && (
          <div className="add-card-error">
            <span className="add-card-error-icon">⚠️</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          className={`add-card-submit-btn ${success ? "success" : ""}`}
          disabled={!stripe || !cardComplete || loading || success}
        >
          {success ? (
            <>✅ Card Added!</>
          ) : loading ? (
            <>
              <span className="add-card-spinner" />
              Adding Card...
            </>
          ) : (
            "Add Card"
          )}
        </button>

        <div className="add-card-security-note">
          🔒 Your card details are encrypted and never stored on our servers.
        </div>
      </form>
    </div>
  );
}
