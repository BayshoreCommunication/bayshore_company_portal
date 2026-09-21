import { Upload, X } from "lucide-react";

const BlogSection = () => {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="section-title">3. Blogs &amp; Articles</span>
          <span className="section-date">Sep 2026</span>
        </div>
        <div className="section-header-actions" style={{ flexShrink: 0 }}>
          <button className="btn-add-item" type="button" style={{ whiteSpace: "nowrap" }}>
            + Add Another Blog
          </button>
          <button
            className="btn-cancel-section"
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}
          >
            <X size={13} strokeWidth={2.5} /> Cancel Section
          </button>
        </div>
      </div>

      <div className="upload-container">
        <div>
          <label className="field-label">Document Link or Upload:</label>
          <input
            type="text"
            className="input-text"
            placeholder="Paste Google Doc or Word Online shareable link..."
            defaultValue="https://docs.google.com/document/d/understanding-product-liability-fl"
          />
          <div className="field-hint">
            Ensure view and comment permissions are granted on the linked document.
          </div>
        </div>

        <div className="upload-dropzone" style={{ padding: 14 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2563eb",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Upload size={14} strokeWidth={2} /> Or Upload PDF / Word Document
          </div>
        </div>

        <div className="doc-preview-tile">
          <div className="doc-badge-icon">DOC</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Understanding Product Liability: What Consumers Need to Know
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#2563eb",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              docs.google.com/document/d/understanding-product-liability-fl
            </div>
          </div>
          <button className="btn-remove-preview" type="button">
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogSection;
