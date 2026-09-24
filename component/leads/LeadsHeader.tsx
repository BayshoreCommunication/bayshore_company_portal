import {
  actionButtons,
  breadcrumbLink,
  breadcrumbRow,
  breadcrumbs,
  btnDraft,
  btnPrimary,
  headlineRow,
  pageDesc,
  pageTitle,
} from "@/component/shared/ui";

const LeadsHeader = () => {
  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <span className={breadcrumbLink}>Leads</span> / <b>Carter Injury Law</b>
        </div>
      </div>

      <div className={headlineRow}>
        <div>
          <div className={pageTitle}>Leads — Carter Injury Law</div>
          <div className={pageDesc}>
            Every inquiry captured across GMB, the website, and social — September 2026.
          </div>
        </div>
        <div className={actionButtons}>
          <button className={btnDraft} type="button">
            Export CSV
          </button>
          <button className={btnPrimary} type="button">
            + Add Lead
          </button>
        </div>
      </div>
    </>
  );
};

export default LeadsHeader;
