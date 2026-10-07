"use client";

import {
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, type MouseEvent } from "react";
import { useNavigation } from "./Navigation";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
};

type NavSection = {
  heading: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { label: "Clients", icon: Users, href: "/clients" },
      { label: "Monthly Reports", icon: FileText, href: "/monthly-reports" },
      { label: "Content", icon: Layers, href: "/content" },
      { label: "Leads", icon: UserPlus, href: "/leads" },
      { label: "Projects", icon: Briefcase, href: "/projects" },
      { label: "Services", icon: Package, href: "/services" },
    ],
  },
  {
    heading: "Workspace",
    items: [
      { label: "Calendar", icon: Calendar, href: "/calendar" },
      { label: "Messages", icon: MessageSquare, href: "/messages", badge: 2 },
      { label: "Payments", icon: CreditCard, href: "/payments" },
    ],
  },
  {
    heading: "Account",
    items: [
      { label: "Notifications", icon: Bell, href: "/notifications" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
];

const Sidebar = () => {
  const pathname = usePathname();
  // `target` is where a click is taking us: its row lights up, and the page area shows that
  // page's skeleton, straight away instead of when the server has answered.
  const { target, navigate } = useNavigation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    // Opening in a new tab or window is left to the browser.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  };

  return (
    // Stays put on the left while the page scrolls beside it; on a short screen it scrolls on its own.
    <div className="sticky top-0 flex h-screen w-57.5 shrink-0 flex-col self-start overflow-y-auto bg-[#0b1522] px-3.5 py-5 text-[#8b9baa]">
      <div className="px-2.5 pb-6">
        <div className="font-[Georgia,serif] text-[20px] font-bold tracking-[0.5px] text-white">
          BayShore
        </div>
      </div>

      <ul className="flex list-none flex-col gap-1">
        {NAV_SECTIONS.map((section) => (
          <Fragment key={section.heading}>
            <li className="px-3 pt-4.5 pb-1.5 text-[10px] font-bold tracking-[1px] text-[#485b6d] uppercase">
              {section.heading}
            </li>
            {section.items.map((item) => {
              const isActive = target ? target === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  {/* The link is the whole row, so a click anywhere on it navigates. */}
                  <Link
                    href={item.href}
                    onClick={(event) => handleClick(event, item.href)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-[13.5px] no-underline ${
                      isActive
                        ? "rounded-r-md border-l-3 border-[#d99136] bg-[#142232] font-semibold text-white"
                        : "rounded-md font-medium text-[#9cb0c3] hover:bg-white/4 hover:text-white"
                    }`}
                  >
                    <Icon size={17} strokeWidth={2} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10.5px] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </Fragment>
        ))}
      </ul>

      <div className="mt-auto rounded-lg bg-[#0f1c2c] p-3.5">
        <p className="mb-2.5 text-[11px] leading-[1.4] text-[#7b8e9f]">
          Need help managing your account? We&apos;re here for you.
        </p>
        <a
          href="#"
          className="block w-full rounded-[5px] border border-[#23374e] bg-[#15273c] p-1.75 text-center text-[11.5px] font-semibold text-[#d1dbe5] no-underline"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
