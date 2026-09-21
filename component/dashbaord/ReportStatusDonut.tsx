import { reportStatus } from "./data";

const ReportStatusDonut = () => {
  return (
    <div className="section-card">
      <div className="section-title" style={{ marginBottom: 16 }}>
        Report Status
      </div>
      <div className="donut-row">
        <div className="donut-chart">
          <div className="donut-center">
            <div className="donut-total">{reportStatus.total}</div>
            <div className="donut-total-lbl">Total</div>
          </div>
        </div>
        <div className="donut-legend">
          {reportStatus.legend.map((item) => (
            <div key={item.label}>
              <span className="dot" style={{ background: item.color }} /> {item.label}{" "}
              <b>{item.value}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportStatusDonut;
