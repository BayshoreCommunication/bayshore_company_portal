import { MapPin, MessageSquare, Megaphone, Package, Search, Shield, Star, type LucideIcon } from "lucide-react";
import type { Service, ServicePlan } from "@/app/actions/service";

// The backend's limits (models/service.model.ts).
export const SERVICE_TITLE_LIMIT = 80;
export const SERVICE_DESCRIPTION_LIMIT = 200;
export const SUB_SERVICE_NAME_LIMIT = 100;
export const SUB_SERVICE_MAX_PRICE = 100000;

export const SERVICE_PLANS: Record<ServicePlan, string> = {
  growth: "Growth Plan",
  core: "Core Plan",
};
export const SERVICE_PLAN_KEYS = Object.keys(SERVICE_PLANS) as ServicePlan[];

// These only decide what the UI shows — the backend enforces the real permissions
// (backend/utils/serviceAccess.ts). The catalog is the superadmin's; choosing which
// services a client takes is open to the staff who work on clients.
export const canManageServices = (role?: string) => role === "superadmin";
export const canAssignServices = (role?: string) =>
  ["employee", "executive", "assistant_manager", "manager", "admin", "superadmin"].includes(role ?? "");

// ── Looks ────────────────────────────────────────────────────────────────────

// A new service's color is picked from its name, so it's the same every time and
// needs no bookkeeping. Saved on the service when it's created.
const SERVICE_COLORS = ["#c8973a", "#2f8f6f", "#3457c9", "#0b1522", "#7c3aed", "#0891b2", "#db2777", "#ea580c"];
export const colorForTitle = (title: string) =>
  SERVICE_COLORS[[...title.trim().toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0) % SERVICE_COLORS.length];

export const serviceColorOf = (service: Pick<Service, "title" | "color">) => service.color || colorForTitle(service.title);

// An icon that fits the kind of service, guessed from its name.
const ICON_HINTS: [RegExp, LucideIcon][] = [
  [/seo|search engine|keyword/i, Search],
  [/google business|gmb|maps|local/i, MapPin],
  [/social|facebook|instagram/i, MessageSquare],
  [/web|hosting|site care/i, Shield],
  [/ads|paid|ppc|campaign/i, Megaphone],
  [/review|reputation/i, Star],
];
export const serviceIconOf = (service: Pick<Service, "title">): LucideIcon =>
  ICON_HINTS.find(([pattern]) => pattern.test(service.title))?.[1] ?? Package;

export const dollars = (amount: number) => `$${amount.toLocaleString("en-US")}`;
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

// What a service costs a month: all its sub-services, or only the `included` ones
// (by id) when pricing it for a client who takes part of it.
export const servicePrice = (service: Pick<Service, "subServices">, included?: string[]) =>
  service.subServices.reduce((sum, item) => (!included || included.includes(item._id) ? sum + item.price : sum), 0);
