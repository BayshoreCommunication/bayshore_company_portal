const PaymentForm = () => {
  return (
    <div className="section-card">
      <div className="section-title" style={{ marginBottom: 16 }}>
        Payment Details
      </div>
      <label className="field-label">Cardholder Name</label>
      <input type="text" className="input-text" placeholder="Jordan Reyes" />
      <div className="form-grid-2" style={{ marginTop: 14 }}>
        <div>
          <label className="field-label">Card Number</label>
          <input type="text" className="input-text" placeholder="4242 4242 4242 4242" />
        </div>
        <div>
          <label className="field-label">Expiry</label>
          <input type="text" className="input-text" placeholder="MM / YY" />
        </div>
      </div>
      <div className="form-grid-2" style={{ marginTop: 14 }}>
        <div>
          <label className="field-label">CVC</label>
          <input type="text" className="input-text" placeholder="123" />
        </div>
        <div>
          <label className="field-label">Billing ZIP</label>
          <input type="text" className="input-text" placeholder="33602" />
        </div>
      </div>
      <div className="field-hint" style={{ marginTop: 12 }}>
        This is a prototype — no real payment is processed.
      </div>
    </div>
  );
};

export default PaymentForm;
