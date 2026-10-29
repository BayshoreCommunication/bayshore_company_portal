"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Eye, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import { getServicesLockAction, unlockServicesAction } from "@/app/actions/servicesLock";

// A client's password, hidden behind an eye. The eye opens a window that asks for the security
// code (the same one as Services — backend: utils/serviceLock.ts), then shows the password.
// Closing it hides the password again; it is never kept on the page.

type Loaded = { ok: boolean; data?: { password: string }; error?: string; status?: number };

type Step = { kind: "loading" } | { kind: "code"; error?: string } | { kind: "denied"; message: string } | { kind: "shown"; password: string };

// The backend's "locked" answer: the code wasn't entered (or its pass ran out).
const LOCKED = 423;

// Asks for the password: shown, or the code first.
const stepFor = async (load: () => Promise<Loaded>): Promise<Step> => {
  const result = await load();
  if (result.ok && result.data) return { kind: "shown", password: result.data.password };
  if (result.status === LOCKED) {
    const lock = await getServicesLockAction();
    return lock.available ? { kind: "code" } : { kind: "denied", message: "You don't have access to passwords. Ask a superadmin if you need it." };
  }
  return { kind: "denied", message: result.error ?? "Couldn't show the password." };
};

export const PasswordEye = ({ label, load }: { label: string; load: () => Promise<Loaded> }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="font-mono">••••••••</span>
      <button
        type="button"
        aria-label={`Show ${label}`}
        onClick={() => setOpen(true)}
        className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#2563eb]"
      >
        <Eye size={13} strokeWidth={2} />
      </button>
      {open ? createPortal(<PasswordModal label={label} load={load} onClose={() => setOpen(false)} />, document.body) : null}
    </span>
  );
};

const PasswordModal = ({ label, load, onClose }: { label: string; load: () => Promise<Loaded>; onClose: () => void }) => {
  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void stepFor(load).then((next) => {
      if (live) setStep(next);
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      live = false;
      document.removeEventListener("keydown", onKey);
    };
    // Once, when the window opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    const result = await unlockServicesAction(code.trim());
    setCode("");
    if (!result.ok) {
      setBusy(false);
      return setStep({ kind: "code", error: result.error ?? "That code isn't right" });
    }
    setStep({ kind: "loading" });
    setStep(await stepFor(load));
    setBusy(false);
  };

  const copy = async (password: string) => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy the password.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-label={label} className="w-full max-w-sm rounded-2xl border border-[#e2e8f0] bg-white p-6 text-left font-normal shadow-[0_24px_64px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
            {step.kind === "denied" ? <Lock size={19} strokeWidth={2} /> : <ShieldCheck size={19} strokeWidth={2} />}
          </span>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-8 cursor-pointer place-items-center rounded-lg text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#0f172a]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <h2 className="mt-3 text-[16px] font-semibold text-[#0f172a]">{label}</h2>

        {step.kind === "loading" ? (
          <div className="mt-4 flex items-center gap-2 text-[13px] text-[#64748b]">
            <Loader2 size={15} className="animate-spin" /> Checking…
          </div>
        ) : step.kind === "code" ? (
          <form onSubmit={(event) => void unlock(event)} className="mt-1">
            <p className="text-[13px] text-[#64748b]">Enter your security code to see it.</p>
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
              className="mt-4 h-11 w-full rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 text-center text-[16px] tracking-[0.3em] text-[#0f172a] outline-none focus:border-[#2563eb] focus:bg-white focus:ring-3 focus:ring-[#2563eb]/12"
            />
            <button
              type="submit"
              disabled={!code.trim() || busy}
              className="mt-2.5 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0f172a] text-[14px] font-semibold text-white hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : null} {busy ? "Checking…" : "Show password"}
            </button>
            {step.error ? (
              <p role="alert" className="mt-2 text-[12.5px] font-medium text-[#b42318]">
                {step.error}
              </p>
            ) : null}
          </form>
        ) : step.kind === "denied" ? (
          <p className="mt-1 text-[13px] text-[#64748b]">{step.message}</p>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
              <span className="min-w-0 flex-1 font-mono text-[15px] break-all text-[#0f172a]">{step.password}</span>
              <button
                type="button"
                aria-label="Copy password"
                onClick={() => void copy(step.password)}
                className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#64748b] hover:bg-white hover:text-[#2563eb]"
              >
                <Copy size={15} strokeWidth={2} />
              </button>
            </div>
            <p className="mt-2 text-[11.5px] text-[#94a3b8]">Hidden again when you close this.</p>
          </>
        )}
      </section>
    </div>
  );
};
