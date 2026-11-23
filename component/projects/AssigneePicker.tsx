"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Search, Users } from "lucide-react";
import { getTeamOverviewAction, type TeamMember } from "@/app/actions/team";
import { roleLabel } from "@/component/shared/roleLabels";

// Picks the team members a new project's starter task is assigned to (the task manager team). The
// chosen ids ride along to the backend, which assigns them on the task manager task.

const initialsOf = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "U";

const AssigneePicker = ({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    void getTeamOverviewAction().then((result) => {
      if (!live) return;
      if (result.ok) setTeam(result.members);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? team.filter((member) => member.name.toLowerCase().includes(q)) : team;
  }, [team, query]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#1f2530]">
        <Users size={13} /> Assign To
      </span>

      {value.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {team
            .filter((member) => value.includes(member.id))
            .map((member) => (
              <span key={member.id} className="inline-flex items-center gap-1 rounded-full bg-[#eef2ff] py-1 pr-1 pl-2.5 text-[12px] font-medium text-[#2545c9]">
                {member.name}
                <button type="button" aria-label={`Remove ${member.name}`} onClick={() => toggle(member.id)} className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-[#dbe3ff]">
                  ×
                </button>
              </span>
            ))}
        </div>
      ) : null}

      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#dbe0e6] bg-white px-3 py-2.5 text-left text-[13px] transition-colors hover:border-[#b9c2cc]"
        >
          <span className={value.length ? "text-[#1f2530]" : "text-[#9aa4ae]"}>{value.length ? `${value.length} assigned` : loading ? "Loading team…" : "Choose team members"}</span>
          <ChevronDown size={15} className={`shrink-0 text-[#7a8a92] transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open ? (
          <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.14)]">
            <div className="flex items-center gap-2 border-b border-[#eef2f7] px-3 py-2">
              <Search size={15} className="shrink-0 text-[#9aa4ae]" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people"
                className="w-full bg-transparent text-[13px] text-[#1f2530] outline-none placeholder:text-[#9aa4ae]"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-[12.5px] text-[#64748b]">
                  <Loader2 size={15} className="animate-spin" /> Loading…
                </div>
              ) : filtered.length ? (
                filtered.map((member) => {
                  const on = value.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(member.id)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors ${on ? "bg-[#f5f8ff]" : "hover:bg-[#f6f8fa]"}`}
                    >
                      {member.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={member.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#0b1522] text-[11px] font-bold text-white">{initialsOf(member.name)}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#1f2530]">{member.name}</span>
                        <span className="block truncate text-[11px] text-[#7a8a92]">{roleLabel(member.role)}</span>
                      </span>
                      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${on ? "border-[#2545c9] bg-[#2545c9] text-white" : "border-[#cbd3dc] text-transparent"}`}>
                        <Check size={12} />
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-6 text-center text-[12.5px] text-[#9aa4ae]">No one found</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AssigneePicker;
