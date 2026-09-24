import { CreditCard } from "lucide-react";
import { recentPayments } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";
import {
  MINI_STATUS,
  miniStatus,
  miniTd,
  miniTh,
  reportRowIcon,
  sectionCard,
  sectionHeader,
  sectionTitle,
} from "@/component/shared/ui";

const RecentPayments = () => {
  return (
    <div className={sectionCard}>
      <div className={sectionHeader}>
        <span className={sectionTitle}>Recent Payments</span>
        <ViewAllLink />
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Client", "Invoice", "Amount", "Date", "Status"].map((heading) => (
              <th key={heading} className={miniTh}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {recentPayments.map((payment) => (
            <tr key={payment.invoice}>
              <td className={miniTd}>
                <span className={`${reportRowIcon} bg-[#dcf3e2] text-[#16a34a]`}>
                  <CreditCard size={14} strokeWidth={2} />
                </span>{" "}
                {payment.client}
              </td>
              <td className={miniTd}>{payment.invoice}</td>
              <td className={miniTd}>
                <b>{payment.amount}</b>
              </td>
              <td className={miniTd}>{payment.date}</td>
              <td className={miniTd}>
                <span className={`${miniStatus} ${MINI_STATUS.sent}`}>{payment.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentPayments;
