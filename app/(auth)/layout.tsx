import "../globals.css";
import "../portal.css";
import "../auth.css";
import AuthBrandPanel from "@/component/auth/AuthBrandPanel";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="auth-shell">
      <AuthBrandPanel />
      <div className="auth-form-panel">{children}</div>
    </div>
  );
};

export default AuthLayout;
