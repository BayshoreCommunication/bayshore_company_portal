"use client";

import { useState } from "react";
import { specialists } from "./data";
import SpecialistGrid from "./SpecialistGrid";
import SpecialistCalendar from "./SpecialistCalendar";
import { pageDesc, pageTitle } from "@/component/shared/ui";

const CalendarView = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = specialists.find((s) => s.key === selectedKey) ?? null;

  return (
    <>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className={pageTitle}>Calendar</div>
          <div className={pageDesc}>
            View each specialist&apos;s availability and the meetings clients have booked with them.
          </div>
        </div>
      </div>

      {selected ? (
        <SpecialistCalendar specialist={selected} onBack={() => setSelectedKey(null)} />
      ) : (
        <SpecialistGrid onSelect={setSelectedKey} />
      )}
    </>
  );
};

export default CalendarView;
