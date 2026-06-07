/**
 * Domain-specific wrappers for your external backend.
 *
 * Update the endpoint paths and types to match your API. Each function
 * gracefully falls back to local bundled data when `VITE_API_BASE_URL`
 * is not configured, so the app keeps working during integration.
 */
import { api, ApiError } from "./api-client";
import { facilities as localFacilities, type Facility } from "@/data/facilities";

export type { Facility };

export interface ReportPayload {
  category: string;
  description: string;
  province?: string;
  district?: string;
  contact?: string;
  anonymous?: boolean;
}

export const backend = {
  // ---------- Facilities ----------
  async listFacilities(params: { province?: string; district?: string; q?: string } = {}): Promise<Facility[]> {
    if (!api.isConfigured()) {
      return filterLocal(params);
    }
    try {
      return await api.get<Facility[]>("/facilities", params);
    } catch (err) {
      console.warn("[backend] /facilities failed, falling back to local data", err);
      return filterLocal(params);
    }
  },

  // ---------- Reports ----------
  async submitReport(payload: ReportPayload): Promise<{ id: string }> {
    if (!api.isConfigured()) {
      throw new ApiError("Backend is not configured. Set VITE_API_BASE_URL.", 0, null);
    }
    return api.post<{ id: string }>("/reports", payload);
  },

  // ---------- Articles ----------
  async listArticles<T = unknown>(): Promise<T[] | null> {
    if (!api.isConfigured()) return null;
    try { return await api.get<T[]>("/articles"); } catch { return null; }
  },

  async getArticle<T = unknown>(slug: string): Promise<T | null> {
    if (!api.isConfigured()) return null;
    try { return await api.get<T>(`/articles/${encodeURIComponent(slug)}`); } catch { return null; }
  },
};

function filterLocal(params: { province?: string; district?: string; q?: string }): Facility[] {
  let rows = localFacilities as Facility[];
  if (params.province) rows = rows.filter((f) => f.province === params.province);
  if (params.district) rows = rows.filter((f) => f.district === params.district);
  if (params.q) {
    const q = params.q.toLowerCase();
    rows = rows.filter((f) => f.name.toLowerCase().includes(q));
  }
  return rows;
}
