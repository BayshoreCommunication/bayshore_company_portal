"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// A client's password, hidden behind an eye: the eye shows it right there (and hides it again),
// and the copy button copies it. It is fetched only when asked for, and only kept while shown.

type Loaded = { ok: boolean; data?: { password: string }; error?: string; status?: number };

const iconButton =
  "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#2563eb] disabled:cursor-wait";

export const PasswordEye = ({ label, load }: { label: string; load: () => Promise<Loaded> }) => {
  const [password, setPassword] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // The password, fetched the first time it is wanted.
  const fetchPassword = async () => {
    if (password !== null) return password;
    setLoading(true);
    const result = await load();
    setLoading(false);
    if (!result.ok || !result.data) {
      toast.error(result.error ?? "Couldn't show the password.");
      return null;
    }
    setPassword(result.data.password);
    return result.data.password;
  };

  const toggle = async () => {
    if (shown) {
      setShown(false);
      return;
    }
    if (await fetchPassword()) setShown(true);
  };

  const copy = async () => {
    const value = await fetchPassword();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy the password.");
    }
  };

  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className={`min-w-0 font-mono [overflow-wrap:anywhere] ${shown ? "select-all" : ""}`}>{shown && password !== null ? password : "••••••••"}</span>
      <button type="button" aria-label={shown ? `Hide ${label}` : `Show ${label}`} title={shown ? "Hide" : "Show"} disabled={loading} onClick={() => void toggle()} className={iconButton}>
        {loading ? <Loader2 size={13} className="animate-spin" /> : shown ? <EyeOff size={13} strokeWidth={2} /> : <Eye size={13} strokeWidth={2} />}
      </button>
      <button type="button" aria-label={`Copy ${label}`} title="Copy" disabled={loading} onClick={() => void copy()} className={iconButton}>
        {copied ? <Check size={13} strokeWidth={2.5} className="text-[#16a34a]" /> : <Copy size={13} strokeWidth={2} />}
      </button>
    </span>
  );
};
