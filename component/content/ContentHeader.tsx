import { ArrowRight } from "lucide-react";
import RoleAlertBanner from "@/component/shared/RoleAlertBanner";

const ContentHeader = () => {
  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          Content / <b>Carter Injury Law</b> / Content Hub
        </div>
      </div>

      <RoleAlertBanner
        message={
          <>
            You&apos;re viewing the <b>Account Manager</b> upload screen.
          </>
        }
        action={
          <button
            className="btn-queue"
            type="button"
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            See Client&apos;s Approval Queue <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        }
      />

      <div className="headline-row">
        <div>
          <div className="page-title">Content Batch Management</div>
          <div className="page-desc">
            Add, organize and review static images, video links, and blog documents for client review.
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-draft" type="button">
            Save Draft
          </button>
          <button className="btn-primary" type="button">
            Send 3 Items for Approval
          </button>
        </div>
      </div>
    </>
  );
};

export default ContentHeader;
