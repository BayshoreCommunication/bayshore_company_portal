import { redirect } from "next/navigation";
import "../globals.css";
import { auth } from "@/auth";
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar user={session.user} />
        <div className="flex flex-col gap-4.5 px-9 pt-6 pb-10">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
