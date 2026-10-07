import { redirect } from "next/navigation";
import "../globals.css";
import { auth } from "@/auth";
import { NavigationProvider, PageArea } from "@/component/layout/Navigation";
import Sidebar from "@/component/layout/Sidebar";
import Topbar from "@/component/layout/Topbar";

const MainLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();

  // proxy.ts already gate-keeps every request that reaches here (including
  // rotating an expiring access token) — this is defense-in-depth only.
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <NavigationProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        {/* No overflow here on purpose: the window is what scrolls, and an overflow container that
            never scrolls would stop `sticky` from working on every page inside it. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={session.user} />
          <div className="flex flex-col gap-4.5 px-9 pt-6 pb-10">
            <PageArea>{children}</PageArea>
          </div>
        </div>
      </div>
    </NavigationProvider>
  );
};

export default MainLayout;
