import { Loader2 } from "lucide-react";

// Shown in the content area the moment a sidebar link is clicked, while the new page
// renders on the server. Having it also lets Next.js prefetch each page's shell, so
// navigation starts instantly instead of waiting for the whole page.
const Loading = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
    <span className="inline-flex items-center gap-2.5 rounded-full border border-[#dbe3de] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#556977] shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
      <Loader2 size={16} strokeWidth={2.25} className="animate-spin text-[#0b1522]" />
      Loading…
    </span>
  </div>
);

export default Loading;
