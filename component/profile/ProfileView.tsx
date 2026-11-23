import type { ReactNode } from "react";
import { Briefcase, Building2, CalendarDays, Clock, Mail, MapPin, Phone, ShieldCheck, UserRound, Users, type LucideIcon } from "lucide-react";
import type { MyProfile } from "@/app/actions/profile";
import { roleLabel } from "@/component/shared/roleLabels";

// The signed-in team member's profile — read only. Same layout as the settings page, but with
// nothing to change: the header card of who they are, their details, and a small account card.

const iconText = "inline-flex items-center gap-1.25";
const card = "rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgba(15,23,42,0.035)]";
const cardHead = "flex items-center justify-between gap-3 border-b border-[#eef2f7] px-5.5 py-4";

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

// The details, in the order they are shown.
const FIELDS: { key: keyof MyProfile; label: string; icon: LucideIcon; wide?: boolean }[] = [
  { key: "fullName", label: "Full name", icon: UserRound },
  { key: "email", label: "Email", icon: Mail },
  { key: "phone", label: "Phone", icon: Phone },
  { key: "designation", label: "Designation", icon: Briefcase },
  { key: "department", label: "Department", icon: Users },
  { key: "companyName", label: "Company", icon: Building2 },
  { key: "address", label: "Address", icon: MapPin, wide: true },
  { key: "responsibilities", label: "Responsibilities", icon: ShieldCheck, wide: true },
];

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

const ProfileView = ({ profile }: { profile: MyProfile }) => {
  const filled = FIELDS.filter((field) => profile[field.key]?.toString().trim()).length;
  const share = Math.round((filled / FIELDS.length) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Who they are. */}
      <section className="relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-white via-white to-[#f8fbff] px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6">
        <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[#dbeafe]/45 blur-3xl" />
        <div className="relative flex min-w-0 gap-4">
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
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 max-[1100px]:grid-cols-1">
        {/* The details, read only. */}
        <section className={card}>
          <div className={cardHead}>
            <div>
              <div className="text-[16px] font-bold text-[#0f172a]">Profile details</div>
              <div className="mt-0.5 text-[12.5px] text-[#64748b]">How the team and your clients see you.</div>
            </div>
          </div>
          <div className="grid gap-x-6 gap-y-5 px-5.5 py-5 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <Detail key={field.key} icon={field.icon} label={field.label} value={profile[field.key]?.toString()} wide={field.wide} />
            ))}
          </div>
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

export default ProfileView;
