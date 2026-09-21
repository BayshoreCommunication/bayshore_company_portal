import RoleAlertBanner from "@/component/shared/RoleAlertBanner";

const ServicesHeader = () => {
  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <span className="breadcrumb-link">Services</span> / <b>Carter Injury Law</b>
        </div>
      </div>

      <RoleAlertBanner
        message={
          <>
            You&apos;re viewing the <b>Account Manager</b> services workspace.
          </>
        }
      />

      <div className="headline-row">
        <div>
          <div className="page-title">Services — Carter Injury Law</div>
          <div className="page-desc">
            Active retainer plans, monthly scope, and the specialists assigned to this account.
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-draft" type="button">
            Contract Summary
          </button>
        </div>
      </div>
    </>
  );
};

export default ServicesHeader;
