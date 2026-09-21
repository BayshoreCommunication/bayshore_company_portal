"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import type { Project, ProjectStatus } from "./data";
import { priorityColor } from "./data";

const STATUS_OPTIONS: ProjectStatus[] = ["New", "In Progress", "Completed"];

const ProjectCard = ({ project }: { project: Project }) => {
  const [status, setStatus] = useState<ProjectStatus>(project.status);

  return (
    <div className="am-project-card">
      <div className="am-project-top">
        <div>
          <div className="am-project-client">{project.clientName}</div>
          <div className="am-project-name">{project.name}</div>
          {project.description ? (
            <div className="am-project-desc">{project.description}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span
            className="lead-status"
            style={{ background: `${priorityColor[project.priority]}1a`, color: priorityColor[project.priority] }}
          >
            {project.priority}
          </span>
          <select
            className="am-status-select"
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="am-project-meta">
        Submitted {project.submitted}
        {project.targetDate ? ` · Target: ${project.targetDate}` : ""}
      </div>
      {project.attachedFiles.length > 0 ? (
        <div
          className="am-project-files"
          style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <Paperclip size={12} strokeWidth={2} /> {project.attachedFiles.join(", ")}
        </div>
      ) : null}
    </div>
  );
};

export default ProjectCard;
