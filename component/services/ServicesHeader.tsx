import RoleAlertBanner from "@/component/shared/RoleAlertBanner";
import {
  actionButtons,
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  headlineRow,
  pageDesc,
  pageTitle,
} from "@/component/shared/ui";

const ServicesHeader = () => {
  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <span className={breadcrumbLink}>Services</span> / <b>Carter Injury Law</b>
        </div>
      </div>

      <RoleAlertBanner
        message={
          <>
            You&apos;re viewing the <b>Account Manager</b> services workspace.
          </>
        }
      />

      <div className={headlineRow}>
        <div>
          <div className={pageTitle}>Services — Carter Injury Law</div>
          <div className={pageDesc}>
            Active retainer plans, monthly scope, and the specialists assigned to this account.
          </div>
        </div>
        <div className={actionButtons}>
          <button className={btnDraft} type="button">
            Contract Summary
          </button>
        </div>
      </div>
    </>
  );
};

export default ServicesHeader;
