const LeadsHeader = () => {
  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <span className="breadcrumb-link">Leads</span> / <b>Carter Injury Law</b>
        </div>
      </div>

      <div className="headline-row">
        <div>
          <div className="page-title">Leads — Carter Injury Law</div>
          <div className="page-desc">
            Every inquiry captured across GMB, the website, and social — September 2026.
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-draft" type="button">
            Export CSV
          </button>
          <button className="btn-primary" type="button">
            + Add Lead
          </button>
        </div>
      </div>
    </>
  );
};

export default LeadsHeader;
