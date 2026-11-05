"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Briefcase, Building2, CalendarDays, Clock, Loader2, Mail, MapPin, Pencil, Phone, ShieldCheck, UserRound, Users, X, type LucideIcon } from "lucide-react";
import { updateMyProfileAction, type MyProfile, type ProfileInput } from "@/app/actions/profile";
import { roleLabel } from "@/component/shared/roleLabels";

// The signed-in team member's profile, laid out like a client's page (ClientDetails.tsx): the
// header card with who they are, their details beside a small account card — and "Edit" turns
// the details into a form, saved there and then.

const iconText = "inline-flex items-center gap-1.25";
const headerAction =
  "inline-flex h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#dbe3ed] bg-white px-3 text-[12px] font-semibold text-[#475569] transition-colors hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:text-[#2563eb]";
const card = "rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)]";
const cardHead = "flex items-center justify-between gap-3 border-b border-[#eef2f7] px-5.5 py-4";
const fieldLabel = "mb-1.5 block text-[12px] font-semibold text-[#334155]";
const input =
  "h-10 w-full rounded-lg border border-[#dbe3ed] bg-white px-3 text-[13px] text-[#0f172a] outline-none placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb]/15";

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "U";

const dateOf = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
const dateTimeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";

// The details, in the order they are shown and edited.
const FIELDS: { key: keyof ProfileInput; label: string; icon: LucideIcon; placeholder: string; wide?: boolean; long?: boolean }[] = [
  { key: "fullName", label: "Full name", icon: UserRound, placeholder: "Your name" },
  { key: "email", label: "Email", icon: Mail, placeholder: "you@bayshorecommunication.com" },
  { key: "phone", label: "Phone", icon: Phone, placeholder: "+1 555 000 0000" },
  { key: "designation", label: "Designation", icon: Briefcase, placeholder: "Account Manager" },
  { key: "department", label: "Department", icon: Users, placeholder: "Client Success" },
  { key: "companyName", label: "Company", icon: Building2, placeholder: "BayShore Communication" },
  { key: "address", label: "Address", icon: MapPin, placeholder: "Street, city, country", wide: true },
  { key: "responsibilities", label: "Responsibilities", icon: ShieldCheck, placeholder: "What you look after", wide: true, long: true },
];

const valuesOf = (profile: MyProfile): Record<keyof ProfileInput, string> =>
  Object.fromEntries(FIELDS.map((field) => [field.key, profile[field.key] ?? ""])) as Record<keyof ProfileInput, string>;

// One detail as it is read: icon, label, and what it holds — or "Not added", greyed.
const Detail = ({ icon: Icon, label, value, wide }: { icon: LucideIcon; label: string; value?: string; wide?: boolean }) => (
  <div className={`flex gap-3 ${wide ? "sm:col-span-2" : ""}`}>
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f1f5f9] text-[#475569]">
      <Icon size={16} strokeWidth={2} />
    </span>
    <div className="min-w-0">
      <div className="text-[11px] font-bold tracking-[0.06em] text-[#94a3b8] uppercase">{label}</div>
      {value?.trim() ? (
        <div className="mt-0.5 text-[13.5px] font-semibold whitespace-pre-wrap text-[#0f172a] [overflow-wrap:anywhere]">{value}</div>
      ) : (
        <div className="mt-0.5 text-[13px] font-medium text-[#a3b1ba]">Not added</div>
      )}
    </div>
  </div>
);

const SideRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-2.5 text-[12.5px]">
    <span className="font-semibold text-[#7a8e9b]">{label}</span>
    <b className="min-w-0 font-bold text-[#17242f] [overflow-wrap:anywhere]">{children}</b>
  </div>
);

const SettingsDetails = ({ profile: saved }: { profile: MyProfile }) => {
  const router = useRouter();
  const [profile, setProfile] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => valuesOf(saved));
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const filled = FIELDS.filter((field) => profile[field.key]?.trim()).length;
  const share = Math.round((filled / FIELDS.length) * 100);

  const startEditing = () => {
    setValues(valuesOf(profile));
    setError(null);
    setEditing(true);
  };

  const save = () => {
    if (!values.fullName.trim()) return setError("Your name can't be empty.");
    // Only what changed is sent.
    const changes = Object.fromEntries(FIELDS.filter((field) => values[field.key].trim() !== (profile[field.key] ?? "")).map((field) => [field.key, values[field.key].trim()])) as ProfileInput;
    if (!Object.keys(changes).length) return setEditing(false);
    startSaving(async () => {
      const result = await updateMyProfileAction(changes);
      if (!result.ok) return setError(result.error);
      setProfile((now) => ({ ...now, ...result.data }));
      setEditing(false);
      toast.success("Profile saved");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Who they are — the header card of a client's page. */}
      <section className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-white via-white to-[#f8fbff] px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6">
        <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[#dbeafe]/45 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar} alt="" className="h-15 w-15 shrink-0 rounded-2xl object-cover shadow-[0_5px_14px_rgba(15,23,42,0.15)]" />
            ) : (
              <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-2xl bg-[#2563eb] text-[17px] font-bold text-white shadow-[0_5px_14px_rgba(15,23,42,0.15)]">{initialsOf(profile.fullName)}</div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-[24px] font-semibold tracking-[-0.025em] text-[#0f172a]">{profile.fullName}</h1>
                <span className="rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[11.5px] font-bold text-[#2563eb]">{roleLabel(profile.role)}</span>
              </div>
              <div className="mt-1 text-[13px] text-[#64748b]">{[profile.designation, profile.department].filter(Boolean).join(" · ") || "Your profile"}</div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-[#64748b]">
                <span className={iconText}>
                  <Mail size={13} /> {profile.email}
                </span>
                {profile.phone ? (
                  <span className={iconText}>
                    <Phone size={13} /> {profile.phone}
                  </span>
                ) : null}
                {profile.createdAt ? (
                  <span className={iconText}>
                    <CalendarDays size={13} /> Joined {dateOf(profile.createdAt)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {!editing ? (
            <button type="button" onClick={startEditing} className={headerAction}>
              <Pencil size={13} /> Edit profile
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[1100px]:grid-cols-1">
        {/* The details: read, or edited in place. */}
        <section className={card}>
          <div className={cardHead}>
            <div>
              <div className="text-[16px] font-bold text-[#0f172a]">Profile details</div>
              <div className="mt-0.5 text-[12.5px] text-[#64748b]">{editing ? "Change what you need, then save." : "How the team and your clients see you."}</div>
            </div>
            {editing ? (
              <button type="button" onClick={() => setEditing(false)} aria-label="Cancel" className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9]">
                <X size={16} />
              </button>
            ) : (
              <button type="button" onClick={startEditing} className={headerAction}>
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="px-5.5 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {FIELDS.map((field) => (
                  <label key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
                    <span className={fieldLabel}>{field.label}</span>
                    {field.long ? (
                      <textarea
                        rows={3}
                        value={values[field.key]}
                        placeholder={field.placeholder}
                        onChange={(event) => setValues((now) => ({ ...now, [field.key]: event.target.value }))}
                        className={`${input} h-auto resize-y py-2.5 leading-relaxed`}
                      />
                    ) : (
                      <input
                        value={values[field.key]}
                        placeholder={field.placeholder}
                        type={field.key === "email" ? "email" : field.key === "phone" ? "tel" : "text"}
                        onChange={(event) => setValues((now) => ({ ...now, [field.key]: event.target.value }))}
                        className={input}
                      />
                    )}
                  </label>
                ))}
              </div>
              {error ? (
                <p role="alert" className="mt-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[12.5px] font-medium text-[#b91c1c]">
                  {error}
                </p>
              ) : null}
              <div className="mt-5 flex justify-end gap-2 border-t border-[#eef2f7] pt-4">
                <button type="button" onClick={() => setEditing(false)} className={headerAction}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[#2563eb] px-4 text-[12.5px] font-bold text-white hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null} Save changes
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-5 px-5.5 py-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <Detail key={field.key} icon={field.icon} label={field.label} value={profile[field.key]} wide={field.wide} />
              ))}
            </div>
          )}
        </section>

        {/* The account itself. */}
        <aside className="sticky top-5 flex flex-col gap-4 max-[1100px]:static">
          <div className={`${card} px-5 py-4.5`}>
            <div className="mb-3.5 border-b border-[#eef2f7] pb-3 text-[14px] font-bold text-[#0f172a]">Account</div>
            <div className="flex flex-col gap-3">
              <SideRow label="Role">{roleLabel(profile.role)}</SideRow>
              <SideRow label="Status">
                <span className="inline-flex items-center gap-1.5 text-[#15803d]">
                  <span className="size-1.5 rounded-full bg-[#16a34a]" /> {profile.status ? profile.status[0].toUpperCase() + profile.status.slice(1) : "Active"}
                </span>
              </SideRow>
              {profile.createdAt ? <SideRow label="Joined">{dateOf(profile.createdAt)}</SideRow> : null}
              {profile.lastLoginAt ? (
                <SideRow label="Last sign-in">
                  <span className={iconText}>
                    <Clock size={12} className="text-[#94a3b8]" /> {dateTimeOf(profile.lastLoginAt)}
                  </span>
                </SideRow>
              ) : null}
            </div>
          </div>

          <div className={`${card} px-5 py-4.5`}>
            <div className="flex items-baseline justify-between">
              <div className="text-[14px] font-bold text-[#0f172a]">Profile complete</div>
              <div className="text-[13px] font-bold text-[#2563eb] tabular-nums">{share}%</div>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
              <div className="h-full rounded-full bg-[#2563eb] transition-[width]" style={{ width: `${share}%` }} />
            </div>
            <div className="mt-2 text-[12px] text-[#64748b]">
              {filled} of {FIELDS.length} details added{filled < FIELDS.length ? " — add the rest so clients know who they're talking to." : "."}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SettingsDetails;
