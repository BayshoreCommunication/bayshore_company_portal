import { redirect } from "next/navigation";
import "../globals.css";
import "../portal.css";
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
    <div className="app-view">
      <Sidebar />
      <div className="workspace">
        <Topbar user={session.user} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
};

export default MainLayout;
