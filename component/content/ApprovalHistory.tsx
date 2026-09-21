import { approvalHistory } from "./data";

const ApprovalHistory = () => {
  return (
    <div className="side-card">
      <div className="side-header">
        <div className="side-title">Approval History</div>
        <div className="side-sub">Carter Injury Law • recent batches</div>
      </div>

      <div className="history-list">
        {approvalHistory.map((item) => (
          <div className="history-item" key={item.title}>
            <div className="h-title">{item.title}</div>
            <div className="h-status" style={{ color: item.tone === "approved" ? "#15803d" : "#b91c1c" }}>
              <span className={item.tone === "approved" ? "dot-green" : "dot-red"} /> {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalHistory;
