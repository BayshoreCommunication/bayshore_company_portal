"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ComponentType,
  type ReactNode,
} from "react";

import { ClientListSkeleton } from "@/component/clients/ClientSkeletons";
import { ContentListSkeleton } from "@/component/content/ContentSkeletons";
import { DashboardSkeleton } from "@/component/dashbaord/DashboardSkeleton";
import { LeadsListSkeleton } from "@/component/leads/LeadSkeletons";
import { ReportListSkeleton } from "@/component/monthly-reports/ReportSkeletons";

// A page is rendered on the server, so after a click there is a wait before it can be shown.
// Rather than leave the old page sitting there (which reads as "nothing happened"), the
// sidebar tells this provider where it is going and the page area switches at once to that
// page's skeleton — the same thing its loading.tsx shows once the server starts answering.

// The pages that have a skeleton of their own. Any other page keeps the current one on
// screen until it arrives.
const SKELETONS: Record<string, ComponentType> = {
  "/dashboard": DashboardSkeleton,
  "/clients": ClientListSkeleton,
  "/monthly-reports": ReportListSkeleton,
  "/content": ContentListSkeleton,
  "/leads": LeadsListSkeleton,
};

type Navigation = {
  // Where a sidebar click is taking us, until that page (or its loading state) is on screen.
  target: string | null;
  navigate: (href: string) => void;
};

const NavigationContext = createContext<Navigation>({
  target: null,
  navigate: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  // Pending from the click until the router has something to show for the new page.
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState<string | null>(null);

  const navigate = (href: string) => {
    setClicked(href);
    startTransition(() => router.push(href));
  };

  return (
    <NavigationContext value={{ target: isPending ? clicked : null, navigate }}>
      {children}
    </NavigationContext>
  );
};

// Where the page goes. While a sidebar navigation is on its way, the page that is being
// left is hidden (kept mounted, so the router can swap in the new one) behind the skeleton.
export const PageArea = ({ children }: { children: ReactNode }) => {
  const { target } = useNavigation();
  const Skeleton = target ? (SKELETONS[target] ?? null) : null;

  return (
    <>
      {Skeleton ? <Skeleton /> : null}
      <div className={Skeleton ? "hidden" : "contents"}>{children}</div>
    </>
  );
};
