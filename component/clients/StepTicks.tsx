"use client";

import { Camera, Check, Globe, Lock, Mail, MapPin, Palette, Server, User, Users, type LucideIcon } from "lucide-react";
import type { Ticks } from "./OnboardingControls";

// The steps of a client's onboarding form, each with a tick: ticked, the client sees it and fills
// it in; unticked, it is left off their form. "About you" is every client's. The same list in
// the client form (adding or editing a client) and on the client's onboarding page. `off` are
// the steps (and items) the client isn't asked, as OnboardingControls keeps them.
export const ONBOARDING_STEPS: [id: string, title: string, icon: LucideIcon, locked?: boolean][] = [
  ["step:contact", "About you", User, true],
  ["step:web", "Website", Globe],
  ["step:domain", "Domain and hosting", Server],
  ["step:email", "Business email", Mail],
  ["step:logo", "Logo", Palette],
  ["step:google", "Google accounts", MapPin],
  ["step:social", "Social media", Users],
  ["step:media", "Photos and videos", Camera],
];

// One line of steps: each a small tick to click, the count beside them. On the client's form:
// green; left off it: amber.
const StepTicks = ({ off, onChange, disabled = false }: { off: Ticks; onChange?: (stepId: string, on: boolean) => void; disabled?: boolean }) => {
  const asked = ONBOARDING_STEPS.filter(([id, , , locked]) => locked || !off[id]).length;
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      <span className="shrink-0 text-[12.5px] whitespace-nowrap text-[#64748b]">
        <b className="font-semibold text-[#0f172a]">
          {asked}/{ONBOARDING_STEPS.length}
        </b>{" "}
        steps
      </span>
      {ONBOARDING_STEPS.map(([id, title, Icon, locked]) => {
        const on = Boolean(locked) || !off[id];
        const fixed = Boolean(locked) || disabled || !onChange;
        return (
          <label
            key={id}
            title={locked ? `${title} — every client fills this in` : on ? `${title} — on the client's form` : `${title} — left off the client's form`}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pr-2.5 pl-2 text-[12.5px] font-semibold whitespace-nowrap transition-colors ${fixed ? "" : "cursor-pointer"} ${
              on ? "border-[#86efac] bg-[#f0fdf4] text-[#166534] hover:border-[#4ade80]" : "border-[#fcd34d] bg-[#fffbeb] text-[#b45309] hover:border-[#f59e0b]"
            }`}
          >
            <span className={`grid size-4 shrink-0 place-items-center rounded ${on ? "bg-[#16a34a] text-white" : "border-2 border-[#f59e0b] bg-white"}`}>
              {locked ? <Lock size={9} strokeWidth={3} /> : on ? <Check size={11} strokeWidth={3} /> : null}
            </span>
            <Icon size={13} strokeWidth={2} className="shrink-0" />
            {title}
            <input type="checkbox" className="sr-only" checked={on} disabled={fixed} onChange={(event) => onChange?.(id, event.target.checked)} />
          </label>
        );
      })}
    </div>
  );
};

export default StepTicks;
