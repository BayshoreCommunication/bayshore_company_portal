import { breadcrumbRow, breadcrumbs, headlineRow, pageDesc, pageTitle } from "@/component/shared/ui";

const ProjectsHeader = () => {
  return (
    <>
      <div className={breadcrumbRow}>
        <div className={breadcrumbs}>
          <b>Projects</b>
        </div>
      </div>

      <div className={headlineRow}>
        <div>
          <div className={pageTitle}>Client Projects</div>
          <div className={pageDesc}>Larger initiatives clients have submitted from their portal.</div>
        </div>
      </div>
    </>
  );
};

export default ProjectsHeader;
