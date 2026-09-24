import { LayoutDashboard, Users, FileText, Calendar } from "lucide-react";

const FEATURES = [
  { icon: LayoutDashboard, text: "One dashboard for every client account" },
  { icon: Users, text: "Track leads, services and onboarding" },
  { icon: FileText, text: "Generate and share monthly reports" },
  { icon: Calendar, text: "Coordinate meetings across your team" },
];

const AuthBrandPanel = () => {
  return (
    <div className="flex max-w-115 flex-[1_1_420px] flex-col justify-center bg-[#0b1522] px-12 py-14 max-[860px]:hidden">
      <div className="font-[Georgia,serif] text-[30px] font-bold text-white">BayShore</div>
      <div className="mt-2.5 max-w-80 text-[14px] leading-[1.6] text-[#9cb0c3]">
        The internal workspace for managing every BayShore client relationship, from onboarding to
        renewal.
      </div>

      <div className="mt-12 flex flex-col gap-5">
        {FEATURES.map((feature) => (
          <div key={feature.text} className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/6 text-[#d99136]">
              <feature.icon size={17} strokeWidth={2} />
            </div>
            <span className="text-[13.5px] text-[#c7d2da]">{feature.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthBrandPanel;
