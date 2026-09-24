"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { BACKEND_API_URL } from "@/lib/backend";

const API = `${BACKEND_API_URL}/reports`;

// Where reports are listed in this portal; refreshed after every change.
const LIST_PATH = "/monthly-reports";

export type ReportPeriodType = "weekly" | "monthly";
export type ReportStatus = "draft" | "submitted" | "approved" | "published";

export interface ReportPerson {
  _id: string;
  fullName: string;
}

export interface ReportClient {
  _id: string;
  companyName: string;
  contactName?: string;
}

export interface ReportBlog {
  title: string;
  publishedAt?: string;
  graphicsCount?: number;
  url?: string;
}

export interface ReportSocial {
  facebookReach?: number;
  instagramReach?: number;
  twitterReach?: number;
  linkedinReach?: number;
  reel?: { title?: string; views?: number };
}

export interface ReportWebsite {
  impressions?: number;
  clicks?: number;
  backlinks?: number;
  referringDomains?: number;
  leadsForwarded?: number;
}

export interface ReportGmbLocation {
  name: string;
  impressions?: number;
  calls?: number;
  directions?: number;
}

export interface ReportGmb {
  impressions?: number;
  calls?: number;
  directionRequests?: number;
  websiteClicks?: number;
  locations: ReportGmbLocation[];
}

export interface Report {
  _id: string;
  // Populated (company name) when read; a plain id when not.
  client: ReportClient | string;
  title: string;
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  summary?: string;
  social?: ReportSocial;
  blogs: ReportBlog[];
  website?: ReportWebsite;
  gmb?: ReportGmb;
  createdBy?: ReportPerson | string;
  submittedAt?: string;
  approvedBy?: ReportPerson | string;
  approvedAt?: string;
  publishedBy?: ReportPerson | string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// The list carries each report's headline only, not its sections.
export type ReportListItem = Omit<Report, "summary" | "social" | "blogs" | "website" | "gmb">;

// The last published report of the same type, for the ▲/▼ percentages.
export interface ReportPrevious {
  title: string;
  periodStart: string;
  periodEnd: string;
  social?: ReportSocial;
  website?: ReportWebsite;
  gmb?: ReportGmb;
}

export interface ReportDetailData {
  report: Report;
  previous: ReportPrevious | null;
}

export interface ReportListData {
  reports: ReportListItem[];
  // Counts across every report the caller can see, whatever filter is applied.
  summary: Record<"total" | ReportStatus, number>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

// A figure is a whole number, 0 or more. Send `null` when editing to clear one.
type Figure = number | null;

export interface ReportContentInput {
  title?: string;
  summary?: string;
  social?: {
    facebookReach?: Figure;
    instagramReach?: Figure;
    twitterReach?: Figure;
    linkedinReach?: Figure;
    reel?: { title?: string; views?: Figure };
  };
  // Lists are replaced whole when sent.
  blogs?: ReportBlog[];
  website?: {
    impressions?: Figure;
    clicks?: Figure;
    backlinks?: Figure;
    referringDomains?: Figure;
    leadsForwarded?: Figure;
  };
  gmb?: {
    impressions?: Figure;
    calls?: Figure;
    directionRequests?: Figure;
    websiteClicks?: Figure;
    locations?: ReportGmbLocation[];
  };
}

export interface ReportInput extends ReportContentInput {
  client: string;
  periodType: ReportPeriodType;
  periodStart: string;
  periodEnd: string;
}

// Editing sends only what changed; the client can't be changed.
export type ReportUpdateInput = ReportContentInput &
  Partial<Pick<ReportInput, "periodType" | "periodStart" | "periodEnd">>;

interface ReportActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  fieldErrors?: string[];
  // HTTP status of a failed request, so pages can tell "not found" from other errors.
  status?: number;
}

async function token() {
  const session = await auth();
  return session?.accessToken;
}

async function failure(response: Response, fallback: string) {
  let message = fallback;
  let errors: string[] | undefined;
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
    if (Array.isArray(body?.errors) && body.errors.length) errors = body.errors as string[];
  } catch {
    // Not JSON — keep the fallback message.
  }
  return { ok: false as const, error: message, fieldErrors: errors, status: response.status };
}

const NOT_SIGNED_IN = { ok: false as const, error: "Not authenticated." };
const NETWORK_ERROR = { ok: false as const, error: "Network error. Please try again." };

const authorised = (accessToken: string, json = false): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  ...(json ? { "Content-Type": "application/json" } : {}),
});

export async function listReportsAction(
  params: {
    page?: number;
    limit?: number;
    status?: "all" | ReportStatus;
    periodType?: "all" | ReportPeriodType;
    client?: string;
    search?: string;
    from?: string;
    to?: string;
  } = {},
): Promise<ReportActionResult<ReportListData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.periodType && params.periodType !== "all") query.set("periodType", params.periodType);
    if (params.client) query.set("client", params.client);
    if (params.search?.trim()) query.set("q", params.search.trim());
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const response = await fetch(`${API}?${query}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch reports.");

    const { data } = await response.json();
    const { reports, summary, pagination } = data;
    return {
      ok: true,
      data: {
        reports,
        summary,
        pagination: {
          ...pagination,
          hasPreviousPage: pagination.page > 1,
          hasNextPage: pagination.page < pagination.totalPages,
        },
      },
    };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function getReportAction(id: string): Promise<ReportActionResult<ReportDetailData>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      headers: authorised(accessToken),
      cache: "no-store",
    });
    if (!response.ok) return failure(response, "Failed to fetch report.");

    const { data } = await response.json();
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function createReportAction(input: ReportInput): Promise<ReportActionResult<Report>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to create report.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function updateReportAction(
  id: string,
  input: ReportUpdateInput,
): Promise<ReportActionResult<Report>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify(input),
    });
    if (!response.ok) return failure(response, "Failed to update report.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

// draft → submitted → approved → published, or back to draft. What each role may do
// is decided by the backend; a refused move comes back as `error`.
export async function changeReportStatusAction(
  id: string,
  status: ReportStatus,
): Promise<ReportActionResult<Report>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}/status`, {
      method: "PATCH",
      headers: authorised(accessToken, true),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) return failure(response, "Failed to change the report status.");

    const { data } = await response.json();
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/${id}`);
    return { ok: true, data };
  } catch {
    return NETWORK_ERROR;
  }
}

export async function deleteReportAction(id: string): Promise<ReportActionResult<null>> {
  const accessToken = await token();
  if (!accessToken) return NOT_SIGNED_IN;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE",
      headers: authorised(accessToken),
    });
    if (!response.ok) return failure(response, "Failed to delete report.");

    revalidatePath(LIST_PATH);
    return { ok: true, data: null };
  } catch {
    return NETWORK_ERROR;
  }
}
