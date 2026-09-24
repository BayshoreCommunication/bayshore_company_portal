import Link from "next/link";
import { Bell, CalendarDays, ChevronDown, LogOut, Search, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { roleLabel as labelForRole } from "@/component/shared/roleLabels";

// White, lightly-bordered pill shared by every topbar control (same as the client portal).
const boxClass = "h-10 rounded-[10px] border border-[#e2e5e9] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

const itemClass =
  "flex w-full cursor-pointer items-center gap-2 rounded-md border-none bg-transparent px-2.5 py-2 text-left text-[12.5px] font-semibold no-underline";

const initialsFromName = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const currentMonthLabel = () => new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

type TopbarUser = {
  name?: string | null;
  role: string;
};

const Topbar = ({ user }: { user: TopbarUser }) => {
  const name = user.name ?? "Account";
  const roleLabel = labelForRole(user.role);

  return (
    <div className="flex items-center justify-between border-b border-[#e1e7e4] bg-white px-8 py-3 print:hidden">
      <div className={`${boxClass} flex w-112.5 items-center gap-2 px-4 focus-within:border-[#9aa3af]`}>
        <Search size={14} strokeWidth={2} className="text-[#8496a3]" />
        <input
          type="text"
          placeholder="Search clients, reports, content..."
          className="w-full border-none bg-transparent text-[13px] text-[#17242f] outline-none placeholder:text-[#8496a3]"
        />
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className={`${boxClass} inline-flex items-center gap-1.5 whitespace-nowrap px-4 text-[13px] font-semibold text-[#17242f]`}>
          <CalendarDays size={14} strokeWidth={2} /> {currentMonthLabel()}
          <ChevronDown size={14} strokeWidth={2} />
        </div>

        <Link
          href="/notifications"
          className={`${boxClass} relative flex w-10 shrink-0 items-center justify-center text-[#17242f] no-underline hover:bg-[#f9fafb]`}
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={2} />
          <span className="absolute -top-0.75 -right-0.75 flex h-4.25 w-4.25 items-center justify-center rounded-full bg-[#dc2626] text-[10px] font-bold text-white">
            1
          </span>
        </Link>

        {/* A CSS-hover dropdown (Tailwind's `group`); group-focus-within keeps it reachable by keyboard. */}
        <div className="group relative">
          <button
            type="button"
            className={`${boxClass} flex cursor-pointer items-center gap-2 pr-3 pl-1.5 font-inherit text-inherit hover:bg-[#f9fafb]`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b1522] text-[11px] font-bold text-white">
              {initialsFromName(name)}
            </span>
            <span className="text-left leading-tight">
              <span className="block text-[12.5px] font-bold whitespace-nowrap text-[#17242f]">{name}</span>
              <span className="block text-[10.5px] whitespace-nowrap text-[#6e808f]">{roleLabel}</span>
            </span>
            <ChevronDown size={14} strokeWidth={2} />
          </button>

          <div className="invisible absolute top-[calc(100%+8px)] right-0 z-40 flex w-50 -translate-y-1 flex-col gap-0.5 rounded-[10px] border border-[#e2e5e9] bg-white p-1.5 opacity-0 shadow-[0_10px_28px_rgba(15,23,42,0.14)] transition-all duration-150 ease-out group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
            <Link href="/settings" className={`${itemClass} text-[#33434f] hover:bg-[#f3f4f6]`}>
              <User size={14} strokeWidth={2} /> Profile
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={`${itemClass} text-[#b91c1c] hover:bg-[#fef2f2]`}>
                <LogOut size={14} strokeWidth={2} /> Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
