"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import PaymentForm from "./PaymentForm";
import { btnDraft, btnSaveClient, btnViewReport, pageDesc, pageTitle, sideCard, sideTitle } from "@/component/shared/ui";
import { orderSummaryItems, orderSummaryTotal } from "./data";

const summaryRow =
  "flex justify-between border-b border-[#eef3ef] pb-2.5 text-[12.5px] text-[#17242f] [&>span:first-child]:font-semibold";

const PaymentCheckout = () => {
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <div className="mt-4.5 flex flex-col items-center rounded-[10px] border border-[#dbe3de] bg-white px-6 py-15 text-center">
        <CircleCheck size={40} strokeWidth={1.75} color="#16a34a" />
        <div className="mt-3.5 text-[19px] font-bold text-[#0d1e2c]">Payment Successful!</div>
        <div className="mt-2 max-w-90 text-[11px] text-[#7a8e9b]">
          Your {orderSummaryItems.length} selected service{orderSummaryItems.length === 1 ? "" : "s"} have been
          activated for Carter Injury Law.
        </div>
        <button className={`${btnViewReport} mt-5`} type="button" onClick={() => setPaid(false)}>
          Back to My Services
        </button>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className={pageTitle}>Complete Your Payment</div>
        <div className={pageDesc}>
          Confirm the services below and enter your payment details to activate them.
        </div>
      </div>

      <div className="mt-4.5 grid grid-cols-[1.6fr_1fr] items-start gap-5">
        <PaymentForm />

        <div className={sideCard}>
          <div className={`${sideTitle} mb-3`}>Order Summary</div>
          <div className="flex flex-col gap-2.5">
            {orderSummaryItems.length === 0 ? (
              <div className="text-[12px] text-[#9aacb8] italic">No services selected.</div>
            ) : (
              <>
                <div className={summaryRow}>
                  <span>
                    {orderSummaryItems.length} selected service{orderSummaryItems.length === 1 ? "" : "s"}
                  </span>
                  <span></span>
                </div>
                {orderSummaryItems.map((item) => (
                  <div className={summaryRow} key={item.name}>
                    <span>{item.name}</span>
                    <span className="font-medium text-[#9aacb8]">{item.category}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-[#dbe3de] pt-3 text-[14px] font-bold text-[#0d1e2c]">
            <span>Total</span>
            <span>${orderSummaryTotal}/mo</span>
          </div>
          <button
            className={`${btnSaveClient} mt-4 w-full justify-center`}
            type="button"
            onClick={() => setPaid(true)}
          >
            Confirm &amp; Pay
          </button>
          <button className={`${btnDraft} mt-2 w-full`} type="button">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentCheckout;
