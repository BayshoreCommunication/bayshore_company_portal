"use client";

import { useState } from "react";
import { specialists } from "./data";
import SpecialistGrid from "./SpecialistGrid";
import SpecialistCalendar from "./SpecialistCalendar";

const CalendarView = () => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selected = specialists.find((s) => s.key === selectedKey) ?? null;

  return (
    <>
      <div className="calendar-header-row">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-desc">
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
