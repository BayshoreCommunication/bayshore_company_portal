import { fieldLabel, formGrid2, inputText, sectionCard, sectionTitle } from "@/component/shared/ui";

const PaymentForm = () => {
  return (
    <div className={sectionCard}>
      <div className={`${sectionTitle} mb-4`}>Payment Details</div>
      <label className={fieldLabel}>Cardholder Name</label>
      <input type="text" className={inputText} placeholder="Jordan Reyes" />
      <div className={`${formGrid2} mt-3.5`}>
        <div>
          <label className={fieldLabel}>Card Number</label>
          <input type="text" className={inputText} placeholder="4242 4242 4242 4242" />
        </div>
        <div>
          <label className={fieldLabel}>Expiry</label>
          <input type="text" className={inputText} placeholder="MM / YY" />
        </div>
      </div>
      <div className={`${formGrid2} mt-3.5`}>
        <div>
          <label className={fieldLabel}>CVC</label>
          <input type="text" className={inputText} placeholder="123" />
        </div>
        <div>
          <label className={fieldLabel}>Billing ZIP</label>
          <input type="text" className={inputText} placeholder="33602" />
        </div>
      </div>
      <div className="mt-3 text-[10.5px] text-[#7a8e9b] italic">
        This is a prototype — no real payment is processed.
      </div>
    </div>
  );
};

export default PaymentForm;
