export type ProjectPriority = "High" | "Medium" | "Low";
export type ProjectStatus = "New" | "In Progress" | "Completed";

export type Project = {
  id: string;
  clientName: string;
  name: string;
  description: string;
  submitted: string;
  targetDate: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  attachedFiles: string[];
};

export const priorityColor: Record<ProjectPriority, string> = {
  High: "#dc2626",
  Medium: "#2563eb",
  Low: "#8496a3",
};

export const projects: Project[] = [
  {
    id: "proj_sample_1",
    clientName: "Carter Injury Law",
    name: "Website Redesign",
    description: "Full redesign of the firm's website with a new intake form and case-results page.",
    submitted: "Sep 20",
    targetDate: "Oct 30, 2026",
    priority: "High",
    status: "New",
    attachedFiles: ["site-brief.pdf"],
  },
];
