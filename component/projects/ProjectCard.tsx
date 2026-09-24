"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import type { Project, ProjectStatus } from "./data";
import { priorityColor } from "./data";

const STATUS_OPTIONS: ProjectStatus[] = ["New", "In Progress", "Completed"];

const ProjectCard = ({ project }: { project: Project }) => {
  const [status, setStatus] = useState<ProjectStatus>(project.status);

  return (
    <div className="mb-3.5 rounded-[10px] border border-[#dbe3de] bg-white px-5 py-4.5">
      <div className="flex items-start justify-between gap-3.5">
        <div>
          <div className="mb-1 text-[11px] font-bold tracking-[0.3px] text-[#2563eb] uppercase">{project.clientName}</div>
          <div className="text-[15px] font-bold text-[#17242f]">{project.name}</div>
          {project.description ? (
            <div className="mt-1 max-w-140 text-[12.5px] text-[#7a8e9b]">{project.description}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="whitespace-nowrap rounded-xl px-2.75 py-1 text-[10.5px] font-bold"
            style={{ background: `${priorityColor[project.priority]}1a`, color: priorityColor[project.priority] }}
          >
            {project.priority}
          </span>
          <select
            className="cursor-pointer rounded-md border border-[#cbd6d0] bg-[#fafcfb] px-2.5 py-1.25 text-[11.5px] font-bold"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2.5 text-[11.5px] text-[#8496a3]">
        Submitted {project.submitted}
        {project.targetDate ? ` · Target: ${project.targetDate}` : ""}
      </div>
      {project.attachedFiles.length > 0 ? (
        <div className="mt-1.5 inline-flex items-center gap-1.25 text-[11.5px] text-[#556977]">
          <Paperclip size={12} strokeWidth={2} /> {project.attachedFiles.join(", ")}
        </div>
      ) : null}
    </div>
  );
};

export default ProjectCard;
