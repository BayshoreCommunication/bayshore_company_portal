import { FolderOpen } from "lucide-react";
import { projects } from "./data";
import ProjectCard from "./ProjectCard";

const ProjectsList = () => {
  if (projects.length === 0) {
    return (
      <div className="flex min-h-105 flex-1 flex-col items-center justify-center text-center">
        <div className="mb-4.5 text-[56px] opacity-70">
          <FolderOpen size={36} strokeWidth={1.5} />
        </div>
        <div className="text-[18px] font-bold text-[#556977]">No client projects yet.</div>
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
