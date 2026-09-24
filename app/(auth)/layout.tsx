import "../globals.css";
import AuthBrandPanel from "@/component/auth/AuthBrandPanel";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />
      <div className="flex flex-[1_1_480px] items-center justify-center bg-[#f2f5f3] px-6 py-10">{children}</div>
    </div>
  );
};

export default AuthLayout;
