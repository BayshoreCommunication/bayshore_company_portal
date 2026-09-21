import { ImagePlus, X } from "lucide-react";

const ImageSection = () => {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="section-title">1. Images &amp; Static Creatives</span>
          <span className="section-date">Sep 2026</span>
        </div>
        <div className="section-header-actions" style={{ flexShrink: 0 }}>
          <button className="btn-add-item" type="button" style={{ whiteSpace: "nowrap" }}>
            + Add Another Image
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

      <div className="upload-split-view">
        <div className="upload-container">
          <div className="upload-dropzone">
            <div className="upload-icon">
              <ImagePlus size={22} strokeWidth={1.75} />
            </div>
            <div className="upload-text">Click to upload image</div>
            <div className="upload-sub">Supports PNG, JPG, WEBP (Up to 10MB)</div>
          </div>

          <div className="preview-box">
            <div className="preview-header">
              <span>Active Preview</span>
              <button
                className="btn-remove-preview"
                type="button"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <X size={12} strokeWidth={2.5} /> Remove
              </button>
            </div>
            <img
              src="https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600&q=80"
              alt="Uploaded graphic preview"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Caption &amp; Copy:</label>
          <textarea
            className="textarea-caption"
            defaultValue="Sunset view of downtown skyline for the event. Call Carter Injury Law today for consultation."
          />
          <div className="field-hint">
            Include hashtags (#CarterInjuryLaw) and campaign hooks.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSection;
