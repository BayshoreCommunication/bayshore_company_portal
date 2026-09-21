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
    <div className="sidebar">
      <div className="brand">
        <div className="brand-title">BayShore</div>
      </div>

      <ul className="nav-group">
        {NAV_SECTIONS.map((section) => (
          <Fragment key={section.heading}>
            <li className="nav-heading">{section.heading}</li>
            {section.items.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const className = `nav-link${isActive ? " active" : ""}${
                item.badge ? " nav-link-badge" : ""
              }`;
              const Icon = item.icon;

              return (
                <li key={item.label} className={className}>
                  <Link
                    href={item.href}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <Icon size={17} strokeWidth={2} />
                    {item.label}
                  </Link>
                  {item.badge ? (
                    <span className="nav-badge">{item.badge}</span>
                  ) : null}
                </li>
              );
            })}
          </Fragment>
        ))}
      </ul>

      <div className="sidebar-bottom">
        <p>Need help managing your account? We&apos;re here for you.</p>
        <a href="#" className="btn-support">
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
