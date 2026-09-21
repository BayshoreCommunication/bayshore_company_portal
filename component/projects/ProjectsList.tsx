import { FolderOpen } from "lucide-react";
import { projects } from "./data";
import ProjectCard from "./ProjectCard";

const ProjectsList = () => {
  if (projects.length === 0) {
    return (
      <div className="empty-state-fullpage">
        <div className="empty-icon-lg">
          <FolderOpen size={36} strokeWidth={1.5} />
        </div>
        <div className="empty-title-lg">No client projects yet.</div>
      </div>
    );
  }

  return (
    <div>
      {projects.map((project) => (
        <ProjectCard project={project} key={project.id} />
      ))}
    </div>
  );
};

export default ProjectsList;
