"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronRight, Flag, Layers, Pencil, Plus } from "lucide-react";
import type { ClientProjects, Project } from "@/app/actions/projects";
import { PROJECT_PRIORITIES as PRIORITIES, dueNote, formatTargetDate } from "./projectUi";

// The "By client" view of Client Projects: each client with its custom projects (a client's
// projects are its custom services), how many there are and how they stand — finished, under
// way, overdue, the next deadline — and the projects themselves. Adding one here adds a custom
// service to that client.

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";
const thClass = "bg-[#f6f7f9] px-3 py-2.5 text-left text-[11px] font-medium whitespace-nowrap text-[#6b7280]";
const linkClass =
  "inline-flex h-7.5 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-[#4b5260] no-underline hover:bg-[#eef0f2] hover:text-[#0b0c24]";
const tdClass = "border-t border-[#eef0f2] px-3 py-2.5 text-[12px] text-[#1f2530]";

const AVATAR_COLORS = ["#2f5fd8", "#7c3aed", "#0891b2", "#d97706", "#16a34a", "#db2777", "#4f46e5"];
const colorFor = (id: string) => AVATAR_COLORS[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "C";

const money = (amount: number) => `$${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const dayLabel = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

// One client: a row that says who it is and how its projects stand, then its projects.
const ClientRows = ({
  group,
  today,
  canWrite,
  statusOf,
  startOpen,
}: {
  group: ClientProjects;
  today: string;
  canWrite: boolean;
  statusOf: (project: Project) => ReactNode;
  startOpen: boolean;
}) => {
  const [open, setOpen] = useState(startOpen);
  const { client, counts, overdue, nextDue, projects } = group;
  const share = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  const toggle = () => setOpen((shown) => !shown);

  return (
    <tbody>
      <tr className={`cursor-pointer ${open ? "bg-[#f8f9fb]" : "hover:bg-[#fafbfc]"}`} onClick={toggle}>
        <td colSpan={6} className="border-t border-[#e6e8eb] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <button type="button" onClick={(event) => (event.stopPropagation(), toggle())} aria-expanded={open} className="flex min-w-0 cursor-pointer items-center gap-2.5 text-left">
              <ChevronRight size={15} strokeWidth={2.25} className={`shrink-0 text-[#94a3b8] transition-transform ${open ? "rotate-90" : ""}`} />
              <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[11.5px] font-bold text-white" style={{ background: colorFor(client._id) }}>
                {initialsOf(client.companyName)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-[#0b0c24]">
                  {client.companyName}
                  {client.contactName ? <span className="font-normal text-[#8a94a3]"> · {client.contactName}</span> : null}
                </span>
                {/* How its projects stand, on one line. */}
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-[#6b7280]">
                  <span>
                    {counts.total} {counts.total === 1 ? "project" : "projects"}
                  </span>
                  <span aria-hidden className="text-[#d1d5db]">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-12 overflow-hidden rounded-full bg-[#e5e7eb]" title={`${share}% completed`}>
                      <span className="block h-full rounded-full bg-[#16a34a]" style={{ width: `${share}%` }} />
                    </span>
                    {counts.completed}/{counts.total} completed
                  </span>
                  {overdue ? (
                    <>
                      <span aria-hidden className="text-[#d1d5db]">•</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#b42318]">
                        <AlertTriangle size={12} strokeWidth={2.5} /> {overdue} overdue
                      </span>
                    </>
                  ) : null}
                  {nextDue ? (
                    <>
                      <span aria-hidden className="text-[#d1d5db]">•</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock size={12} strokeWidth={2} /> Next deadline {dayLabel(nextDue)}
                      </span>
                    </>
                  ) : null}
                </span>
              </span>
            </button>
            <span className="flex items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
              <Link href={`/services?client=${client._id}`} className={linkClass}>
                <Layers size={12.5} strokeWidth={2} /> Services
              </Link>
              {canWrite ? (
                <Link href={`/projects/add?client=${client._id}`} className={linkClass}>
                  <Plus size={13} strokeWidth={2.5} /> Add
                </Link>
              ) : null}
            </span>
          </div>
        </td>
      </tr>

      {open
        ? projects.map((project) => {
            const due = dueNote(project, today);
            const priority = PRIORITIES[project.priority];
            return (
              <tr key={project._id} className="hover:bg-[#fafbfc]">
                <td className={`${tdClass} pl-14`}>
                  <span className="block max-w-80 truncate font-medium" title={project.name}>
                    {project.name}
                  </span>
                  {project.description ? (
                    <span className="block max-w-80 truncate text-[11px] text-[#8a94a3]" title={project.description}>
                      {project.description.split("\n").join(" · ")}
                    </span>
                  ) : null}
                </td>
                <td className={tdClass}>{statusOf(project)}</td>
                <td className={tdClass}>
                  <span className="inline-flex items-center gap-1.5" style={{ color: priority.color }}>
                    <Flag size={12} strokeWidth={2.25} /> {priority.label}
                  </span>
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  {formatTargetDate(project.targetDate) || <span className="text-[#94a3b8]">No deadline</span>}
                  {due ? (
                    <span className={`mt-0.5 block text-[11px] ${due.tone === "overdue" ? "font-medium text-[#b42318]" : due.tone === "soon" ? "font-medium text-[#b45309]" : "text-[#8a94a3]"}`}>
                      {due.text}
                    </span>
                  ) : null}
                </td>
                <td className={`${tdClass} whitespace-nowrap tabular-nums`}>{project.price ? money(project.price) : <span className="text-[#94a3b8]">Not priced</span>}</td>
                <td className={`${tdClass} pr-4 text-right`}>
                  {canWrite ? (
                    <Link
                      href={`/projects/${project._id}/edit`}
                      aria-label={`Edit ${project.name}`}
                      className="inline-flex size-7.5 items-center justify-center rounded-md text-[#6b7280] no-underline hover:bg-[#eef0f2] hover:text-[#0b0c24]"
                    >
                      <Pencil size={14} strokeWidth={2} />
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })
        : null}
    </tbody>
  );
};

const ProjectsByClient = ({
  groups,
  today,
  canWrite,
  statusOf,
  empty,
}: {
  groups: ClientProjects[];
  today: string;
  canWrite: boolean;
  // The status control (or pill) for one project.
  statusOf: (project: Project) => ReactNode;
  // Shown when no client has a project that matches.
  empty: ReactNode;
}) =>
  groups.length ? (
    <div className={`${cardClass} overflow-x-auto`}>
      {/* One table: the columns once, then each client and its projects. */}
      <table className="w-full min-w-190 border-separate border-spacing-0">
        <thead>
          <tr>
            <th className={`${thClass} pl-14`}>Project</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Priority</th>
            <th className={thClass}>Deadline</th>
            <th className={thClass}>Price</th>
            <th className={`${thClass} pr-4`}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        {/* A few open to begin with; the rest a click away. */}
        {groups.map((group, index) => (
          <ClientRows key={group.client._id} group={group} today={today} canWrite={canWrite} statusOf={statusOf} startOpen={groups.length <= 3 || index < 2} />
        ))}
      </table>
    </div>
  ) : (
    <div className={cardClass}>{empty}</div>
  );

export default ProjectsByClient;
