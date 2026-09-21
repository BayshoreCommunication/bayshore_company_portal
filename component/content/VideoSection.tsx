import { Upload, X } from "lucide-react";

const VideoSection = () => {
  return (
    <div className="section-card">
      <div className="section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="section-title">2. Videos &amp; Short-form Reels</span>
          <span className="section-date">Sep 2026</span>
        </div>
        <div className="section-header-actions" style={{ flexShrink: 0 }}>
          <button className="btn-add-item" type="button" style={{ whiteSpace: "nowrap" }}>
            + Add Another Video
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
          <div>
            <label className="field-label">Video Link or Upload:</label>
            <input
              type="text"
              className="input-text"
              placeholder="Paste YouTube, Vimeo, Drive, or CDN URL"
              defaultValue="https://www.w3schools.com/html/mov_bbb.mp4"
            />
          </div>

          <div className="upload-dropzone" style={{ padding: 10 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#2563eb",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Upload size={13} strokeWidth={2} /> Or Upload MP4/MOV File Directly
            </div>
          </div>

          <div className="preview-box">
            <div className="preview-header">
              <span>Video Player Preview</span>
              <button
                className="btn-remove-preview"
                type="button"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <X size={12} strokeWidth={2.5} /> Clear
              </button>
            </div>
            <video controls>
              <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
              Your browser does not support HTML5 video.
            </video>
          </div>
        </div>

        <div>
          <label className="field-label">Caption &amp; Script Notes:</label>
          <textarea
            className="textarea-caption"
            defaultValue="Car wreck? 🚗💥 We handle the headache while you recover! No fees unless we win 💪 Call (813) 922-0228."
          />
          <div className="field-hint">
            Supports Instagram Reels, TikTok, and YouTube Shorts format.
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
