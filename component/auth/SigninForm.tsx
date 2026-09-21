"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signInAction, type SignInState } from "@/app/actions/auth";

const SigninForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-card">
      <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: "#17242f" }}>
        Welcome back
      </div>
      <div className="page-desc" style={{ marginBottom: 28 }}>
        Sign in with your BayShore staff account.
      </div>

      <form action={action}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <label className="field-label" htmlFor="identifier">
          Email
        </label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            <Mail size={15} strokeWidth={2} />
          </span>
          <input
            id="identifier"
            className="input-text"
            type="email"
            name="identifier"
            placeholder="you@bayshore.com"
            autoComplete="username"
            required
          />
        </div>

        <label className="field-label" htmlFor="password" style={{ marginTop: 16 }}>
          Password
        </label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            <Lock size={15} strokeWidth={2} />
          </span>
          <input
            id="password"
            className="input-text"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="auth-input-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
          </button>
        </div>

        {state?.error ? <div className="auth-error-banner">{state.error}</div> : null}

        <button className="auth-submit-btn" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
};

export default SigninForm;
