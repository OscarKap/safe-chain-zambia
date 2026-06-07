/**
 * Generic REST API client for integrating your external Safe Chain backend.
 *
 * Configure the base URL by setting `VITE_API_BASE_URL` in your environment.
 * Optionally set `VITE_API_KEY` for a static API key, or call `setAuthToken()`
 * after the user logs in to send a Bearer JWT on every request.
 *
 * Usage:
 *   import { api } from "@/lib/api-client";
 *   const facilities = await api.get<Facility[]>("/facilities", { province: "Lusaka" });
 *   const report = await api.post<{ id: string }>("/reports", { ...payload });
 */

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const STATIC_API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

let bearerToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("sc_api_token") : null;

export function setAuthToken(token: string | null) {
  bearerToken = token;
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("sc_api_token", token);
  else localStorage.removeItem("sc_api_token");
}

export function getAuthToken() {
  return bearerToken;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  if (!BASE_URL) {
    throw new ApiError(
      "VITE_API_BASE_URL is not configured. Add it to your environment to enable the backend integration.",
      0,
      null,
    );
  }
  const url = new URL(path.startsWith("/") ? `${BASE_URL}${path}` : `${BASE_URL}/${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
    ...(STATIC_API_KEY ? { "x-api-key": STATIC_API_KEY } : {}),
    ...opts.headers,
  };

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
      null,
    );
  }

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    let msg = res.statusText || `Request failed (${res.status})`;
    if (parsed && typeof parsed === "object" && "message" in parsed) {
      msg = String((parsed as { message: unknown }).message);
    }
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown, query?: Query) => request<T>("POST", path, { body, query }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
  isConfigured: () => Boolean(BASE_URL),
};

export const API_BASE_URL = BASE_URL;
