import PaymentCheckout from "@/component/payments/PaymentCheckout";

const PaymentsPage = () => {
  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <span className="breadcrumb-link">Services</span> / <b>Payment</b>
        </div>
      </div>

      <PaymentCheckout />
    </>
  );
};

export default PaymentsPage;
