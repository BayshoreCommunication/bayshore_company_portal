"use client";

import { useState, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import type { OnboardingAnswers } from "@/app/actions/onboarding";
import { sectionCard, sectionTitle } from "@/component/shared/ui";
import { NONE, TONES, groupsOf, isAnswered, linkOf, type Item } from "./onboardingRequestUi";

const pill = "inline-flex shrink-0 items-center whitespace-nowrap rounded-xl px-2.5 py-0.75 text-[11px] font-bold";

// Fields and what is in them — "None", greyed, where there is nothing. A web address opens in
// a new tab.
export const Fields = ({ rows }: { rows: [label: string, value: string][] }) => (
  <dl className="flex flex-col gap-1.5">
    {rows.map(([label, value]) => {
      const link = linkOf(value);
      return (
        <div key={label} className="grid grid-cols-[150px_minmax(0,1fr)] gap-2.5 text-[12px]">
          <dt className="font-semibold text-[#7a8e9b]">{label}</dt>
          <dd className={`whitespace-pre-line break-words ${value === NONE ? "text-[#a3b1ba]" : "text-[#24333f]"}`}>
            {link ? (
              <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-[#2563eb] hover:underline">
                <span className="truncate">{link}</span>
                <ArrowUpRight size={12} strokeWidth={2.25} className="shrink-0" />
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      );
    })}
  </dl>
);

// One thing the client was asked about, in a box of its own: where it stands for the team,
// and all of its fields.
const ItemBox = ({ item }: { item: Item }) => (
  <div className="rounded-lg border border-[#e6ece8] bg-[#fbfcfb] p-4">
    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#eef3ef] pb-2.5">
      <span className="text-[13px] font-bold text-[#17242f]">{item.name}</span>
      <span className={`${pill} ${TONES[item.tone].className}`}>{item.label}</span>
    </div>
    <Fields rows={item.details} />
  </div>
);

// The onboarding form's answers, a tab for each step of the form in the order it asks them —
// Website, Domain and hosting, Business email and so on — one step on show at a time. Every
// field is listed with what the client put in it, and "None" where they put nothing, so a
// client who never went through onboarding shows every field as "None". Each tab says how many
// of its items were answered. `first` is a tab to put ahead of the form's own.
const OnboardingAnswerTabs = ({ onboarding, first }: { onboarding?: OnboardingAnswers; first?: { title: string; content: ReactNode } }) => {
  const tabs: { title: string; items?: Item[]; content?: ReactNode }[] = [
    ...(first ? [first] : []),
    ...groupsOf({ onboarding: onboarding ?? { status: "in_progress" } }),
  ];
  const [chosen, setChosen] = useState(0);
  const active = Math.min(chosen, tabs.length - 1);
  const tab = tabs[active];

  return (
    <div>
      <div role="tablist" aria-label="Onboarding answers" className="flex gap-1.5 overflow-x-auto rounded-lg border border-[#dbe3de] bg-white p-1">
        {tabs.map((entry, index) => {
          const on = index === active;
          return (
            <button
              key={entry.title}
              type="button"
              role="tab"
              id={`onboarding-tab-${index}`}
              aria-selected={on}
              aria-controls="onboarding-tab-panel"
              onClick={() => setChosen(index)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-1.75 text-[12.5px] font-semibold transition-colors ${
                on ? "bg-[#2563eb] text-white" : "text-[#64748b] hover:bg-[#f1f5f3] hover:text-[#17242f]"
              }`}
            >
              <span className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] font-bold ${on ? "bg-white/20 text-white" : "bg-[#eef1ef] text-[#64748b]"}`}>
                {index + 1}
              </span>
              {entry.title}
              {entry.items ? (
                <span className={`rounded-full px-1.5 text-[10.5px] font-bold ${on ? "bg-white/20 text-white" : "bg-[#eef1ef] text-[#7a8e9b]"}`}>
                  {entry.items.filter(isAnswered).length}/{entry.items.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section role="tabpanel" id="onboarding-tab-panel" aria-labelledby={`onboarding-tab-${active}`} className={`${sectionCard} mt-3.5`}>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={sectionTitle}>{tab.title}</h2>
          <span className="text-[11.5px] text-[#7a8e9b]">
            Step {active + 1} of {tabs.length}
          </span>
        </div>
        {tab.items ? (
          <div className={`grid items-start gap-4 ${tab.items.length > 1 ? "min-[1000px]:grid-cols-2" : ""}`}>
            {tab.items.map((item) => (
              <ItemBox item={item} key={item.id} />
            ))}
          </div>
        ) : (
          tab.content
        )}
      </section>
    </div>
  );
};

export default OnboardingAnswerTabs;
