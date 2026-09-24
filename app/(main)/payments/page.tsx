import PaymentCheckout from "@/component/payments/PaymentCheckout";
import { breadcrumbLink, breadcrumbRow, breadcrumbs } from "@/component/shared/ui";

const PaymentsPage = () => {
  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <span className={breadcrumbLink}>Services</span> / <b>Payment</b>
        </div>
      </div>

      <PaymentCheckout />
    </>
  );
};

export default PaymentsPage;
