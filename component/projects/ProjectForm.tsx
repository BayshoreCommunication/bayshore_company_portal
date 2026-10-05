"use client";

import { useRef, useState, useSyncExternalStore, useTransition, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Eye, Flag, FolderKanban, Loader2, Paperclip, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import {
  createProjectAction,
  deleteProjectAction,
  updateProjectAction,
  type Project,
  type ProjectFile,
  type ProjectPriority,
  type ProjectStatus,
} from "@/app/actions/projects";
import { todayInputValue } from "@/component/clients/clientUi";
import {
  PROJECT_DESCRIPTION_LIMIT,
  PROJECT_FILE_ACCEPT,
  PROJECT_FILE_KINDS,
  PROJECT_MAX_FILES,
  PROJECT_NAME_LIMIT,
  PROJECT_PRIORITIES as PRIORITIES,
  PROJECT_PRIORITY_KEYS,
  PROJECT_STATUSES as STATUSES,
  PROJECT_STATUS_KEYS,
  clientNameOf,
  fileBadgeFor,
  fileProblem,
  formatFileSize,
  formatTargetDate,
  subscribeNever,
  targetDateInput,
} from "./projectUi";

const cardClass = "rounded-2xl border border-[#e6e8eb] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.05)]";

const labelClass = "mb-1.5 block text-[12px] font-medium text-[#1f2530]";
const fieldClass =
  "h-10 w-full rounded-lg border border-[#e2e5e9] bg-white px-3 text-[12.5px] text-[#1f2530] outline-none placeholder:text-[#9aa3af] focus:border-[#9aa3af] disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#4b5260]";
const selectClass = `${fieldClass} cursor-pointer`;
const rowClass = "grid grid-cols-1 gap-4 sm:grid-cols-2";
const star = <span className="text-[#dc2626]">*</span>;

type ClientOption = { _id: string; companyName: string };
type Outcome = { ok: boolean; error?: string; fieldErrors?: string[] };

// New files travel as a multipart form through the /api/projects route handlers —
// a server action caps the request at 1MB, far below one 25MB attachment.
const sendWithFiles = async (url: string, method: "POST" | "PATCH", form: FormData): Promise<Outcome> => {
  try {
    const response = await fetch(url, { method, body: form });
    const body = await response.json().catch(() => null);
    if (response.ok) return { ok: true };
    return {
      ok: false,
      error: typeof body?.message === "string" ? body.message : "Something went wrong.",
      fieldErrors: Array.isArray(body?.errors) ? body.errors : undefined,
    };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
};

const FileRow = ({
  name,
  size,
  note,
  removed = false,
  onToggle,
}: {
  name: string;
  size: number;
  note?: string;
  removed?: boolean;
  onToggle: () => void;
}) => {
  const badge = fileBadgeFor(name);

  return (
    <li className={`flex items-center gap-2.5 rounded-lg border border-[#e6e8eb] bg-white px-3 py-2 ${removed ? "opacity-55" : ""}`}>
      <span
        className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white"
        style={{ background: badge.color }}
      >
        {badge.label}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[12px] font-medium text-[#1f2530] ${removed ? "line-through" : ""}`} title={name}>
          {name}
        </span>
        <span className="mt-px block text-[11px] text-[#6b7280]">
          {formatFileSize(size)}
          {note ? ` · ${note}` : ""}
        </span>
      </span>
      <button
        type="button"
        className={`inline-flex h-7.5 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-md text-[#4b5260] ${
          removed ? "px-2 text-[11.5px] font-medium hover:bg-[#f3f4f6] hover:text-[#0b0c24]" : "w-7.5 hover:bg-[#fdecec] hover:text-[#b42318]"
        }`}
        aria-label={`${removed ? "Keep" : "Remove"} ${name}`}
        onClick={onToggle}
      >
        {removed ? (
          <>
            <RotateCcw size={12} strokeWidth={2.25} /> Keep
          </>
        ) : (
          <X size={15} strokeWidth={2.25} />
        )}
      </button>
    </li>
  );
};

// Asks once in place before deleting; on success goes back to the list.
const DeleteProject = ({ project }: { project: Project }) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProjectAction(project._id);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete project.");
        return;
      }
      toast.success(`${project.name} was deleted`);
      router.push("/projects");
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#f0b8b8] bg-white px-4 text-[12.5px] font-medium text-[#b42318] hover:bg-[#fdecec]"
        onClick={() => setConfirming(true)}
      >
        <Trash2 size={14} strokeWidth={2} /> Delete
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#b42318]">
      Delete this project and its files?
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center gap-1.5 rounded-lg bg-[#dc2626] px-4 text-[12.5px] font-medium text-white hover:bg-[#b91c1c] disabled:cursor-wait"
        disabled={isPending}
        aria-busy={isPending}
        onClick={handleDelete}
      >
        {isPending ? <Loader2 size={14} strokeWidth={2.5} className="animate-spin" /> : <Trash2 size={14} strokeWidth={2} />}
        {isPending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        className="flex h-9.5 cursor-pointer items-center rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] hover:bg-[#f3f4f6]"
        disabled={isPending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </span>
  );
};

// Pass `project` to edit an existing one; leave it out to open a new one for a
// client (a request made by phone or in a meeting). `clients` are the ones the
// signed-in person can see — only needed when adding.
const ProjectForm = ({ project, clients = [], canDelete = false }: { project?: Project; clients?: ClientOption[]; canDelete?: boolean }) => {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(project);

  const [client, setClient] = useState(project ? "" : clients.length === 1 ? clients[0]._id : "");
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [targetDate, setTargetDate] = useState(targetDateInput(project?.targetDate));
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? "normal");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "new");
  // Files already on the project stay listed; the ones marked here go when saved.
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  // Files that couldn't be attached on the last try, and why.
  const [skipped, setSkipped] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  // "Today" depends on the visitor's timezone, so it's read in the browser only.
  const today = useSyncExternalStore(subscribeNever, todayInputValue, () => "");

  const existing: ProjectFile[] = project?.files ?? [];
  const keptCount = existing.length - removedUrls.length;
  const fileCount = keptCount + newFiles.length;
  const clientName = project ? clientNameOf(project.client) : clients.find((option) => option._id === client)?.companyName;

  // Takes what fits: skips files of the wrong type, over the size limit or already
  // attached, and stops at the file count limit — saying which were left out.
  const attach = (chosen: File[]) => {
    const next = [...newFiles];
    const left: string[] = [];
    for (const file of chosen) {
      const problem = fileProblem(file);
      if (problem) left.push(problem);
      else if (next.some((added) => added.name === file.name && added.size === file.size)) continue;
      else if (keptCount + next.length >= PROJECT_MAX_FILES) left.push(`"${file.name}" wasn't added — a project can have up to ${PROJECT_MAX_FILES} files.`);
      else next.push(file);
    }
    setNewFiles(next);
    setSkipped(left);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    attach(Array.from(event.dataTransfer.files));
  };

  const toggleRemoved = (url: string) =>
    setRemovedUrls((previous) => (previous.includes(url) ? previous.filter((entry) => entry !== url) : [...previous, url]));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors([]);

    const problem = !project && !client
      ? "Choose the client this project is for."
      : !name.trim()
        ? "Give the project a name."
        : fileCount > PROJECT_MAX_FILES
          ? `A project can have up to ${PROJECT_MAX_FILES} files — remove ${fileCount - PROJECT_MAX_FILES} to continue.`
          : null;
    if (problem) {
      setError(problem);
      toast.error(problem);
      return;
    }

    const fields = { name: name.trim(), description: description.trim(), targetDate, priority, status };
    setSaving(true);

    let outcome: Outcome;
    if (newFiles.length) {
      const form = new FormData();
      if (!project) form.append("client", client);
      for (const [key, value] of Object.entries(fields)) form.append(key, value);
      for (const url of removedUrls) form.append("removeFiles", url);
      for (const file of newFiles) form.append("files", file);
      outcome = project
        ? await sendWithFiles(`/api/projects/${project._id}`, "PATCH", form)
        : await sendWithFiles("/api/projects", "POST", form);
    } else {
      outcome = project
        ? await updateProjectAction(project._id, { ...fields, removeFiles: removedUrls })
        : await createProjectAction({ ...fields, client });
    }

    if (!outcome.ok) {
      setSaving(false);
      setError(outcome.error ?? "Something went wrong.");
      setFieldErrors(outcome.fieldErrors ?? []);
      toast.error(outcome.error ?? "Something went wrong.");
      return;
    }

    toast.success(project ? "Project updated successfully" : "Project created successfully");
    router.push("/projects");
    // The route handler's upload isn't a navigation, so ask for the fresh list.
    router.refresh();
  };

  const statusMeta = STATUSES[status];

  return (
    <div className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[28px] leading-tight font-bold text-[#0b0c24]">{isEdit ? "Edit Project" : "New Project"}</div>
          <div className="mt-1 text-[12.5px] text-[#4b5563]">
            {isEdit
              ? "Update the details, the files or where the project stands. The client sees the changes in their portal."
              : "For a request a client made by phone or in a meeting. It appears in their portal too."}
          </div>
        </div>
        <Link
          href="/projects"
          className="flex h-9.5 items-center gap-1.5 rounded-lg border border-[#e2e5e9] bg-white px-4 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
        >
          <ArrowLeft size={14} strokeWidth={2} /> Back to Projects
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-4.5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <form onSubmit={handleSubmit} className={`${cardClass} p-5`} noValidate>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClass} htmlFor="project-client">
                Client {isEdit ? null : star}
              </label>
              {project ? (
                <input id="project-client" type="text" className={fieldClass} value={clientName || "—"} disabled />
              ) : (
                <select id="project-client" className={selectClass} value={client} onChange={(event) => setClient(event.target.value)}>
                  <option value="" disabled>
                    {clients.length ? "Select a client" : "No clients available"}
                  </option>
                  {clients.map((option) => (
                    <option key={option._id} value={option._id}>
                      {option.companyName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="project-name">
                Project Name {star}
              </label>
              <input
                id="project-name"
                type="text"
                className={fieldClass}
                placeholder="e.g. Website Redesign"
                maxLength={PROJECT_NAME_LIMIT}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="project-description">
                Description
              </label>
              <textarea
                id="project-description"
                className={`${fieldClass} h-28 resize-y py-2.5`}
                placeholder="What is this project about?"
                maxLength={PROJECT_DESCRIPTION_LIMIT}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className={rowClass}>
              <div>
                <label className={labelClass} htmlFor="project-target">
                  Target Completion
                </label>
                <input
                  id="project-target"
                  type="date"
                  className={selectClass}
                  // An existing date may already be behind us; a new one can't be.
                  min={isEdit ? undefined : today || undefined}
                  value={targetDate}
                  onChange={(event) => setTargetDate(event.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="project-priority">
                  Priority
                </label>
                <select
                  id="project-priority"
                  className={selectClass}
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as ProjectPriority)}
                >
                  {PROJECT_PRIORITY_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {PRIORITIES[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={rowClass}>
              <div>
                <label className={labelClass} htmlFor="project-status">
                  Status
                </label>
                <select id="project-status" className={selectClass} value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
                  {PROJECT_STATUS_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {STATUSES[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className={labelClass}>
                Attach Files <span className="font-normal text-[#6b7280]">(optional)</span>
              </div>
              <input
                ref={fileInput}
                type="file"
                multiple
                accept={PROJECT_FILE_ACCEPT}
                className="hidden"
                onChange={(event) => {
                  attach(Array.from(event.target.files ?? []));
                  // Clear it so picking the same file again still fires a change.
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                className={`flex w-full cursor-pointer flex-col items-center rounded-xl border-[1.5px] border-dashed px-3 py-5 text-center transition-colors ${
                  dragging ? "border-[#2f5fd8] bg-[#eef3fd]" : "border-[#d5d9df] bg-[#f9fafb] hover:border-[#2f5fd8] hover:bg-[#f3f6fd]"
                }`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <Paperclip size={22} strokeWidth={2} className="mb-1.5 text-[#2f5fd8]" />
                <span className="text-[12.5px] font-medium text-[#0b0c24]">{dragging ? "Drop to attach" : "Click to upload, or drag files here"}</span>
                <span className="mt-0.5 text-[11px] text-[#6b7280]">
                  {PROJECT_FILE_KINDS} · up to 25MB each · up to {PROJECT_MAX_FILES} files
                </span>
              </button>

              {skipped.length ? (
                <div role="alert" className="mt-2.5 rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12px] text-[#b42318]">
                  {skipped.map((message) => (
                    <div key={message}>{message}</div>
                  ))}
                </div>
              ) : null}

              {existing.length || newFiles.length ? (
                <ul className="mt-2.5 flex list-none flex-col gap-2">
                  {existing.map((file) => {
                    const removed = removedUrls.includes(file.url);
                    return (
                      <FileRow
                        key={file.url}
                        name={file.name}
                        size={file.size}
                        note={removed ? "will be removed when you save" : undefined}
                        removed={removed}
                        onToggle={() => toggleRemoved(file.url)}
                      />
                    );
                  })}
                  {newFiles.map((file, index) => (
                    <FileRow
                      key={`${file.name}-${file.size}`}
                      name={file.name}
                      size={file.size}
                      note={isEdit ? "new" : undefined}
                      onToggle={() => setNewFiles((previous) => previous.filter((_, i) => i !== index))}
                    />
                  ))}
                </ul>
              ) : null}
            </div>

            {error ? (
              <div role="alert" className="rounded-lg border border-[#f5c2c2] bg-[#fdecec] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b42318]">
                {error}
                {fieldErrors.length > 0 ? (
                  <ul className="mt-1.5 list-disc pl-4.5 font-normal">
                    {fieldErrors.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2.5 border-t border-[#eef0f2] pt-4 sm:flex-row sm:items-center">
            {project && canDelete ? <DeleteProject project={project} /> : null}
            <div className="flex flex-col-reverse gap-2.5 sm:ml-auto sm:flex-row">
              <Link
                href="/projects"
                className="flex h-9.5 items-center justify-center rounded-lg border border-[#e2e5e9] bg-white px-4.5 text-[12.5px] font-medium text-[#1f2530] no-underline hover:bg-[#f3f4f6]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="flex h-9.5 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#0b0c24] px-4.5 text-[12.5px] font-medium text-white hover:bg-[#1e2140] disabled:cursor-wait disabled:opacity-70"
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? (
                  <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
                ) : isEdit ? (
                  <Save size={14} strokeWidth={2} />
                ) : (
                  <Plus size={14} strokeWidth={2.5} />
                )}
                {saving ? (newFiles.length ? "Uploading…" : "Saving…") : isEdit ? "Save Changes" : "Create Project"}
              </button>
            </div>
          </div>
        </form>

        {/* How the project will look in the list, filled in live as the form is typed. */}
        <div className={`${cardClass} p-4.5`}>
          <div className="mb-3.5 flex items-center gap-2 text-[13px] font-semibold text-[#0b0c24]">
            <Eye size={15} strokeWidth={2} className="text-[#2f5fd8]" /> Preview
          </div>
          <div className="rounded-xl border border-[#eef0f2] bg-[#f9fafb] p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d9e0ef] text-[#2f5fd8]">
                <FolderKanban size={16} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12.5px] font-medium text-[#1f2530]" title={name.trim() || undefined}>
                  {name.trim() || "New project"}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-[#6b7280]">{description.trim() || "No description yet"}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-[#eef0f2] pt-3 text-[11.5px]">
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-[#6b7280]">Client</span>
                <span className="truncate font-medium text-[#1f2530]">{clientName || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Priority</span>
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: PRIORITIES[priority].color }}>
                  <Flag size={12} strokeWidth={2.25} /> {PRIORITIES[priority].label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Target date</span>
                <span className="font-medium text-[#1f2530]">{formatTargetDate(targetDate) || "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Files</span>
                <span className="inline-flex items-center gap-1.25 font-medium text-[#1f2530]">
                  {fileCount ? (
                    <>
                      <Paperclip size={12} strokeWidth={2} /> {fileCount}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#6b7280]">Status</span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: statusMeta.background, color: statusMeta.color }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusMeta.dot }} />
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;
