import {
  FileText,
  GalleryHorizontalEnd,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Megaphone,
  Play,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type { ContentMedia, ContentType } from "@/app/actions/content";

// Everything the team can prepare for a client — the same list as the backend's
// content types (models/content.model.ts), with how each one looks and behaves here.
export type ContentKind = ContentType;

export type Media = ContentMedia;

// Fields some kinds need on top of title + upload + caption.
export type KindField = "pageName" | "pageUrl" | "subject" | "headline" | "cta";

// Any piece can carry several files — a post with a few photos, a set of short videos…
export const MAX_FILES = 10;

// The backend's per-file caps and the most files one save can carry. Checked here
// first so a too-big file is caught before it's uploaded.
export const MEDIA_MAX_BYTES: Record<Media, number> = {
  image: 10 * 1024 * 1024,
  video: 200 * 1024 * 1024,
  doc: 20 * 1024 * 1024,
};
export const MAX_FILES_PER_SAVE = 40;

// The exact file types the backend stores (models/content.model.ts) — the file
// picker's "image/*" would otherwise let through HEIC, SVG and the like.
const UPLOADABLE_MIME_TYPES: Record<Media, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  doc: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "application/rtf",
    "text/rtf",
    "text/plain",
  ],
};

// Why a file can't be uploaded, or null when it's fine.
export const uploadProblem = (file: File): string | null => {
  const media = mediaOf(file);
  if (!UPLOADABLE_MIME_TYPES[media].includes(file.type)) return `"${file.name}" isn't a supported file type`;
  if (file.size > MEDIA_MAX_BYTES[media])
    return `"${file.name}" is over the ${MEDIA_MAX_BYTES[media] / (1024 * 1024)}MB limit for ${media}s`;
  return null;
};

export type KindSpec = {
  label: string;
  sub: string;
  icon: LucideIcon;
  color: string;
  background: string;
  // What can be uploaded, how many, and whether a pasted link can stand in for the files.
  media: Media[];
  minFiles: number;
  maxFiles: number;
  linkPlaceholder?: string;
  captionLabel: string;
  captionPlaceholder: string;
  fields: KindField[];
};

export const CONTENT_KINDS: Record<ContentKind, KindSpec> = {
  image: {
    label: "Image Post",
    sub: "Social graphics or photos — one or several",
    icon: ImageIcon,
    color: "#2563eb",
    background: "#dbeafe",
    media: ["image"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "Caption",
    captionPlaceholder: "Write the post caption...",
    fields: [],
  },
  carousel: {
    label: "Carousel",
    sub: "2–10 images people swipe through",
    icon: GalleryHorizontalEnd,
    color: "#0891b2",
    background: "#cffafe",
    media: ["image"],
    minFiles: 2,
    maxFiles: MAX_FILES,
    captionLabel: "Caption",
    captionPlaceholder: "Write the post caption...",
    fields: [],
  },
  story: {
    label: "Story",
    sub: "A 24-hour vertical story (9:16)",
    icon: Smartphone,
    color: "#db2777",
    background: "#fce7f3",
    media: ["image", "video"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "On-screen text",
    captionPlaceholder: "Any text, sticker or link to add to the story...",
    fields: [],
  },
  video: {
    label: "Video / Reel",
    sub: "One or more reels, shorts or videos",
    icon: Play,
    color: "#dc2626",
    background: "#fbdada",
    media: ["video"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste a video link (YouTube, Google Drive)",
    captionLabel: "Caption",
    captionPlaceholder: "Write the video caption...",
    fields: [],
  },
  blog: {
    label: "Blog Article",
    sub: "An SEO article for the client's blog",
    icon: FileText,
    color: "#c8973a",
    background: "#fdf1de",
    media: ["doc"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste the Google Doc link",
    captionLabel: "Summary",
    captionPlaceholder: "A line or two about what the article covers...",
    fields: [],
  },
  website: {
    label: "Website Content",
    sub: "Copy for a page — Home, Services, About…",
    icon: Globe,
    color: "#16a34a",
    background: "#dcf3e2",
    media: ["doc"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste the Google Doc link",
    captionLabel: "What changed",
    captionPlaceholder: "New page, updated sections, anything the client should check...",
    fields: ["pageName", "pageUrl"],
  },
  email: {
    label: "Email Newsletter",
    sub: "An email campaign to the client's list",
    icon: Mail,
    color: "#7c3aed",
    background: "#ede9fe",
    media: ["doc", "image"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    linkPlaceholder: "…or paste a Google Doc or Mailchimp preview link",
    captionLabel: "Preview text",
    captionPlaceholder: "The short line shown after the subject in the inbox...",
    fields: ["subject"],
  },
  gmb: {
    label: "Google Business Post",
    sub: "An update or offer on the Google profile",
    icon: MapPin,
    color: "#ea580c",
    background: "#ffedd5",
    media: ["image"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "Post text",
    captionPlaceholder: "What's new — an offer, event or update...",
    fields: ["cta"],
  },
  ad: {
    label: "Ad Creative",
    sub: "A paid social or Google ad",
    icon: Megaphone,
    color: "#334155",
    background: "#e2e8f0",
    media: ["image", "video"],
    minFiles: 1,
    maxFiles: MAX_FILES,
    captionLabel: "Ad copy",
    captionPlaceholder: "The main text of the ad...",
    fields: ["headline", "cta"],
  },
};

export const KIND_ORDER: ContentKind[] = ["image", "carousel", "story", "video", "blog", "website", "email", "gmb", "ad"];

export const CTA_OPTIONS = ["Learn more", "Call now", "Book", "Get offer", "Sign up", "Contact us"];

const ACCEPT: Record<Media, string> = {
  image: "image/*",
  video: "video/*",
  doc: ".doc,.docx,.pdf,.txt,.rtf,.odt",
};

const MEDIA_HINT: Record<Media, string> = {
  image: "PNG, JPG or WebP",
  video: "MP4 or MOV",
  doc: "Word, PDF or text",
};

const MEDIA_NOUN: Record<Media, string> = { image: "image", video: "video", doc: "document" };

export const acceptFor = (kind: ContentKind) => CONTENT_KINDS[kind].media.map((media) => ACCEPT[media]).join(",");

export const uploadHint = (kind: ContentKind) => {
  const spec = CONTENT_KINDS[kind];
  const count = spec.minFiles > 1 ? `${spec.minFiles}–${spec.maxFiles} files` : `Up to ${spec.maxFiles} files`;
  return `${spec.media.map((media) => MEDIA_HINT[media]).join(" or ")} · ${count}`;
};

// "images", "images or videos", "documents"
export const uploadNoun = (kind: ContentKind) => CONTENT_KINDS[kind].media.map((media) => `${MEDIA_NOUN[media]}s`).join(" or ");

export const mediaOf = (file: { type: string }): Media =>
  file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "doc";
