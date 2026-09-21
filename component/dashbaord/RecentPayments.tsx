import { CreditCard } from "lucide-react";
import { recentPayments } from "./data";
import ViewAllLink from "@/component/shared/ViewAllLink";

const RecentPayments = () => {
  return (
    <div className="section-card">
      <div className="section-header">
        <span className="section-title">Recent Payments</span>
        <ViewAllLink />
      </div>
      <table className="report-mini-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Invoice</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {recentPayments.map((payment) => (
            <tr key={payment.invoice}>
              <td>
                <span className="report-row-icon" style={{ background: "#dcf3e2", color: "#16a34a" }}>
                  <CreditCard size={14} strokeWidth={2} />
                </span>{" "}
                {payment.client}
              </td>
              <td>{payment.invoice}</td>
              <td>
                <b>{payment.amount}</b>
              </td>
              <td>{payment.date}</td>
              <td>
                <span className="mini-status sent">{payment.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentPayments;
