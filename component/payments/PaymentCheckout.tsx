"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { orderSummaryItems, orderSummaryTotal } from "./data";

const PaymentCheckout = () => {
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <div className="payment-success-card">
        <CircleCheck size={40} strokeWidth={1.75} color="#16a34a" />
        <div style={{ fontSize: 19, fontWeight: 700, color: "#0d1e2c", marginTop: 14 }}>
          Payment Successful!
        </div>
        <div className="dash-pending-sub" style={{ marginTop: 8, maxWidth: 360 }}>
          Your {orderSummaryItems.length} selected service{orderSummaryItems.length === 1 ? "" : "s"} have been
          activated for Carter Injury Law.
        </div>
        <button className="btn-view-report" style={{ marginTop: 20 }} type="button" onClick={() => setPaid(false)}>
          Back to My Services
        </button>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="page-title">Complete Your Payment</div>
        <div className="page-desc">
          Confirm the services below and enter your payment details to activate them.
        </div>
      </div>

      <div className="dash-main-grid" style={{ gridTemplateColumns: "1.6fr 1fr", marginTop: 18 }}>
        <PaymentForm />

        <div className="side-card">
          <div className="side-title" style={{ marginBottom: 12 }}>
            Order Summary
          </div>
          <div className="order-summary-list">
            {orderSummaryItems.length === 0 ? (
              <div className="order-summary-empty">No services selected.</div>
            ) : (
              <>
                <div className="order-summary-row">
                  <span>
                    {orderSummaryItems.length} selected service{orderSummaryItems.length === 1 ? "" : "s"}
                  </span>
                  <span></span>
                </div>
                {orderSummaryItems.map((item) => (
                  <div className="order-summary-row" key={item.name}>
                    <span>{item.name}</span>
                    <span style={{ color: "#9aacb8", fontWeight: 500 }}>{item.category}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="order-summary-total">
            <span>Total</span>
            <span>${orderSummaryTotal}/mo</span>
          </div>
          <button
            className="btn-save-client"
            style={{ width: "100%", marginTop: 16, justifyContent: "center" }}
            type="button"
            onClick={() => setPaid(true)}
          >
            Confirm &amp; Pay
          </button>
          <button className="btn-draft" style={{ width: "100%", marginTop: 8 }} type="button">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentCheckout;
