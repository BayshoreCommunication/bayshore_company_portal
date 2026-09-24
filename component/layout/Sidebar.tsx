"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Layers,
  UserPlus,
  Package,
  Briefcase,
  Calendar,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

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
      { label: "Services", icon: Package, href: "/services" },
      { label: "Projects", icon: Briefcase, href: "/projects" },
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

  return (
    <div className="flex w-57.5 shrink-0 flex-col bg-[#0b1522] px-3.5 py-5 text-[#8b9baa]">
      <div className="px-2.5 pb-6">
        <div className="font-[Georgia,serif] text-[20px] font-bold tracking-[0.5px] text-white">BayShore</div>
      </div>

      <ul className="flex list-none flex-col gap-1">
        {NAV_SECTIONS.map((section) => (
          <Fragment key={section.heading}>
            <li className="px-3 pt-4.5 pb-1.5 text-[10px] font-bold tracking-[1px] text-[#485b6d] uppercase">
              {section.heading}
            </li>
            {section.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const className = `flex cursor-pointer items-center gap-3 px-3 py-2.5 text-[13.5px] ${
                isActive
                  ? "rounded-r-md border-l-3 border-[#d99136] bg-[#142232] font-semibold text-white"
                  : "rounded-md font-medium text-[#9cb0c3] hover:bg-white/4 hover:text-white"
              }${item.badge ? " justify-between" : ""}`;
              const Icon = item.icon;

              return (
                <li key={item.label} className={className}>
                  <Link href={item.href} className="flex items-center gap-2.5">
                    <Icon size={17} strokeWidth={2} />
                    {item.label}
                  </Link>
                  {item.badge ? (
                    <span className="ml-auto flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10.5px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </Fragment>
        ))}
      </ul>

      <div className="mt-auto rounded-lg bg-[#0f1c2c] p-3.5">
        <p className="mb-2.5 text-[11px] leading-[1.4] text-[#7b8e9f]">Need help managing your account? We&apos;re here for you.</p>
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
