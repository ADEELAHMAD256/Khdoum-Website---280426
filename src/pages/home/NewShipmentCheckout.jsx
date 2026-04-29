import React, { useState } from "react";
import CustomText from "../../components/CustomText";
import CustomCheckBox from "../../components/CustomCheckBox";
import backButtonIcon from "../../assets/icons/back_button_icon.svg";
import { Box, CreditCard, PlusCircle } from "lucide-react";
import { SiVisa } from "react-icons/si";
import "./NewShipmentCheckout.css";

export default function NewShipmentCheckout({
  onBack,
  onConfirm,
  onAddCard,
  userName = "",
  itemTotal = 1,
  fees = 3.0,
  submitting = false,
  cards = [],
  loadingCards = false,
  errorCards = "",
  onRetryCards,
}) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const displayCards = Array.isArray(cards) ? cards : [];
  console.log("NEW_SHIPMENT_CHECKOUT_CARDS_PROP:", cards);
  console.log("NEW_SHIPMENT_CHECKOUT_DISPLAY_CARDS:", displayCards);

  const handleCheckout = () => {
    if (!acceptedTerms || !selectedCardId) return;
    onConfirm?.(selectedCardId);
  };

  return (
    <div className="checkout-overlay">
      <div className="checkout-header">
        <button
          className="details-back-button"
          type="button"
          onClick={onBack}
          aria-label="Back"
        >
          <img src={backButtonIcon} alt="Back" />
        </button>
        <div className="checkout-title-container">
          <CustomText size="18px" weight="700">
            {userName}
          </CustomText>
          <CustomText className="checkout-subtitle" size="14px" weight="600">
            Check-Out
          </CustomText>
        </div>
        <div className="checkout-icon-container">
          <Box className="checkout-icon" color="#df2429" />
        </div>
      </div>

      <div className="checkout-section">
        <CustomText className="checkout-section-title" size="15px" weight="700">
          Payment Summary
        </CustomText>
        <div className="summary-card">
          <div className="summary-row">
            <CustomText size="14px" color="#6f6f6f">
              Item Total
            </CustomText>
            <CustomText size="14px" weight="600">
              {itemTotal}
            </CustomText>
          </div>
          <div className="summary-row">
            <CustomText size="14px" color="#6f6f6f">
              Khdoum fees
            </CustomText>
            <CustomText size="14px" weight="600">
              JOD {fees.toFixed(2)}
            </CustomText>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-total">
            <CustomText size="16px" weight="800">
              Total
            </CustomText>
            <CustomText size="16px" weight="800">
              JOD {fees.toFixed(2)}
            </CustomText>
          </div>
        </div>
      </div>



      <div className="checkout-checkbox-container">
        <CustomCheckBox
          value={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          label={
            <span style={{ fontSize: "13px" }}>
              I accept all the{" "}
              <span
                className="checkout-terms-link"
                onClick={(e) => {
                  e.stopPropagation();
                  alert("Terms and Conditions clicked!");
                }}
              >
                terms and conditions
              </span>{" "}
              of using the services
            </span>
          }
        />
      </div>

      <div className="checkout-section">
        <CustomText className="checkout-section-title" size="15px" weight="700">
          Select payment method
        </CustomText>
        <div className="payment-methods-list">
          {loadingCards ? (
            <div className="checkout-loading-container">
              <CustomText size="14px">Loading cards...</CustomText>
            </div>
          ) : errorCards ? (
            <div className="checkout-error-container">
              <CustomText size="14px" color="red">
                {errorCards}
              </CustomText>
              <button
                className="retry-btn"
                type="button"
                onClick={onRetryCards}
              >
                Retry
              </button>
            </div>
          ) : displayCards.length === 0 ? (
            <div className="checkout-empty-container">
              <CustomText size="14px">
                No cards found. Please add a card.
              </CustomText>
            </div>
          ) : (
            displayCards.map((card) => {
              const cardId = card._id || card.id;
              const isVisa =
                (card.brand || card.type || "").toLowerCase() === "visa";
              return (
                <div
                  key={cardId}
                  className={`payment-method-item ${selectedCardId === cardId ? "active" : ""}`}
                  onClick={() => setSelectedCardId(cardId)}
                >
                  <div className="payment-method-radio"></div>
                  <div className="payment-method-info">
                    <CustomText size="14px" weight="600">
                      **** {card.last4}
                    </CustomText>
                    {isVisa && <SiVisa size={24} color="#1A1F71" />}
                  </div>
                </div>
              );
            })
          )}
          <button className="add-card-btn" type="button" onClick={onAddCard}>
            <CreditCard size={20} />
            <CustomText size="14px" weight="600">
              Add New Card
            </CustomText>
          </button>
        </div>
      </div>

      <div className="checkout-footer">
        <div className="footer-total-row">
          <CustomText size="18px" weight="800">
            Total
          </CustomText>
          <CustomText size="18px" weight="800">
            JOD {fees.toFixed(2)}
          </CustomText>
        </div>
        <button
          className="checkout-submit-btn"
          type="button"
          onClick={handleCheckout}
          disabled={!acceptedTerms || !selectedCardId || submitting}
        >
          {submitting ? "Processing..." : "Check Out"}
        </button>
      </div>
    </div>
  );
}
