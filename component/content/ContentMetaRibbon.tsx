import { contentMeta } from "./data";

const ContentMetaRibbon = () => {
  return (
    <div className="meta-card">
      <div className="meta-col">
        <div className="meta-lbl">Client</div>
        <div className="meta-val">{contentMeta.client}</div>
      </div>
      <div className="meta-col">
        <div className="meta-lbl">Content Month</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select className="month-select" defaultValue={contentMeta.months[0]}>
            {contentMeta.months.map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>
          <button
            className="btn-individual-content"
            type="button"
            title="Send content outside the monthly batch"
          >
            + Individual Content
          </button>
        </div>
      </div>
      <div className="meta-col">
        <div className="meta-lbl">Batch Status</div>
        <div className="status-pill">
          <span className="status-dot" /> Draft
        </div>
      </div>
      <div className="meta-col">
        <div className="meta-lbl">Items</div>
        <div className="meta-val">{contentMeta.itemsSummary}</div>
      </div>
      <div className="meta-col">
        <div className="meta-lbl">Prepared By</div>
        <div className="meta-val">{contentMeta.preparedBy}</div>
      </div>
    </div>
  );
};

export default ContentMetaRibbon;
