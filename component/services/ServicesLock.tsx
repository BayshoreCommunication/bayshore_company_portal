"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { unlockServicesAction } from "@/app/actions/servicesLock";

// In front of Services: the security code (backend: utils/serviceLock.ts). Someone with no code
// set for them is told so, and can't go further.
const ServicesLock = ({ available }: { available: boolean }) => {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await unlockServicesAction(code.trim());
      if (!result.ok) {
        setError(result.error ?? "That code isn't right");
        setCode("");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
          {available ? <ShieldCheck size={22} strokeWidth={2} /> : <Lock size={22} strokeWidth={2} />}
        </span>
        <h1 className="mt-4 text-[18px] font-semibold text-[#0f172a]">Services are locked</h1>
        {available ? (
          <>
            <p className="mt-1 text-[13px] text-[#64748b]">Enter your security code to open Services.</p>
            <form onSubmit={submit} className="mt-5 flex flex-col gap-2.5">
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                maxLength={64}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Security code"
                aria-label="Security code"
                className="h-11 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-center text-[16px] tracking-[0.3em] text-[#0f172a] outline-none focus:border-[#2563eb] focus:bg-white focus:ring-3 focus:ring-[#2563eb]/12"
              />
              <button
                type="submit"
                disabled={!code.trim() || pending}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0f172a] text-[14px] font-semibold text-white hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? <Loader2 size={15} className="animate-spin" /> : null} {pending ? "Checking…" : "Unlock"}
              </button>
              {error ? (
                <p role="alert" className="text-[12.5px] font-medium text-[#b42318]">
                  {error}
                </p>
              ) : null}
            </form>
            <p className="mt-4 text-[11.5px] text-[#94a3b8]">It stays open on this browser for 8 hours.</p>
          </>
        ) : (
          <p className="mt-1 text-[13px] text-[#64748b]">You don&apos;t have access to Services. Ask a superadmin if you need it.</p>
        )}
      </div>
    </div>
  );
};

export default ServicesLock;
