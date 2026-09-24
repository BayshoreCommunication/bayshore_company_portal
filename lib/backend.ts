// The BayShore backend's API base URL, built from BACKEND_API_URL — every server
// action, route handler, auth.ts and proxy.ts calls the backend through this.
//
// BACKEND_API_URL may be the server's root ("https://bayshore-portal-backend.vercel.app")
// or the full API base (".../api/v1"), with or without a trailing slash; either way
// requests go to <root>/api/v1/... . Unset, it points at a local backend.
const API_PREFIX = "/api/v1";

const root = (process.env.BACKEND_API_URL ?? "http://localhost:8000").trim().replace(/\/+$/, "");

export const BACKEND_API_URL = root.endsWith(API_PREFIX) ? root : `${root}${API_PREFIX}`;
