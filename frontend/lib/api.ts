import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; full_name: string; password: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post("/api/auth/reset-password", { token, new_password }),
  verifyEmail: (token: string) => api.post("/api/auth/verify-email", { token }),
};

// ── Bots ──────────────────────────────────────────────
export const botsApi = {
  list: () => api.get("/api/bots"),
  create: (data: BotCreatePayload) => api.post("/api/bots", data),
  get: (id: string) => api.get(`/api/bots/${id}`),
  update: (id: string, data: Partial<BotCreatePayload>) =>
    api.put(`/api/bots/${id}`, data),
  delete: (id: string) => api.delete(`/api/bots/${id}`),
  regeneratePrompt: (id: string) =>
    api.post(`/api/bots/${id}/regenerate-prompt`),
  regenerateKey: (id: string) => api.post(`/api/bots/${id}/regenerate-key`),
  stats: (id: string) => api.get(`/api/bots/${id}/stats`),
};

// ── Admin ─────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get("/api/admin/dashboard"),
  conversations: (
    botId: string,
    params?: { platform?: string; limit?: number; offset?: number },
  ) => api.get(`/api/admin/bots/${botId}/conversations`, { params }),
  conversation: (id: string) => api.get(`/api/admin/conversations/${id}`),
  analytics: (botId: string, days?: number) =>
    api.get(`/api/admin/bots/${botId}/analytics`, {
      params: { days: days ?? 30 },
    }),
  toggleHandoff: (conversationId: string, enable: boolean) =>
    api.post(`/api/admin/conversations/${conversationId}/handoff`, null, {
      params: { enable },
    }),
  adminReply: (conversationId: string, content: string) =>
    api.post(`/api/admin/conversations/${conversationId}/reply`, { content }),
};

// ── Knowledge Base ─────────────────────────────────────
export const knowledgeApi = {
  list: (botId: string) => api.get(`/api/knowledge/bots/${botId}/documents`),
  upload: (botId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/api/knowledge/bots/${botId}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  crawl: (botId: string, url: string) =>
    api.post(`/api/knowledge/bots/${botId}/crawl`, { url }),
  delete: (docId: string) => api.delete(`/api/knowledge/documents/${docId}`),
};

// ── Broadcast ──────────────────────────────────────────
export const broadcastApi = {
  list: (botId: string) => api.get(`/api/broadcast/bots/${botId}/campaigns`),
  send: (botId: string, data: BroadcastCreatePayload) =>
    api.post(`/api/broadcast/bots/${botId}/send`, data),
};

// ── Billing ───────────────────────────────────────────
export const billingApi = {
  plans: () => api.get("/api/billing/plans"),
  subscription: () => api.get("/api/billing/subscription"),
  checkout: (plan: "pro" | "business") =>
    api.post("/api/billing/checkout", { plan }),
};

// ── Widget ────────────────────────────────────────────
export const widgetApi = {
  getCode: (botId: string) => api.get(`/api/bots/${botId}/widget-code`),
};

// ── Export ─────────────────────────────────────────────
export const exportApi = {
  csv: (botId: string) =>
    api.get(`/api/export/bots/${botId}/conversations/csv`, {
      responseType: "blob",
    }),
  excel: (botId: string) =>
    api.get(`/api/export/bots/${botId}/conversations/excel`, {
      responseType: "blob",
    }),
};

// ── Types ─────────────────────────────────────────────
export interface BotCreatePayload {
  name: string;
  company_name: string;
  business_type?: string;
  description?: string;
  products_services?: string;
  pricing_info?: string;
  phone?: string;
  email_contact?: string;
  website?: string;
  address?: string;
  facebook_url?: string;
  line_id?: string;
  instagram_url?: string;
  bot_name?: string;
  bot_personality?: string;
  response_language?: string;
  greeting_message?: string;
  model_name?: string;
  openai_api_key?: string;
  line_channel_secret?: string;
  line_channel_access_token?: string;
  fb_page_token?: string;
  fb_verify_token?: string;
  fb_app_secret?: string;
  instagram_access_token?: string;
  instagram_verify_token?: string;
  handoff_enabled?: boolean;
  handoff_keywords?: string;
  is_active?: boolean;
}

export interface Bot {
  id: string;
  name: string;
  company_name: string;
  business_type?: string;
  description?: string;
  products_services?: string;
  pricing_info?: string;
  phone?: string;
  email_contact?: string;
  website?: string;
  address?: string;
  facebook_url?: string;
  line_id?: string;
  instagram_url?: string;
  bot_name: string;
  bot_personality?: string;
  response_language: string;
  greeting_message?: string;
  system_prompt?: string;
  api_key: string;
  model_name?: string;
  openai_api_key?: string;
  line_channel_secret?: string;
  line_channel_access_token?: string;
  fb_page_token?: string;
  fb_verify_token?: string;
  fb_app_secret?: string;
  instagram_access_token?: string;
  instagram_verify_token?: string;
  total_messages: number;
  total_conversations: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  bot_id: string;
  platform: string;
  external_user_id?: string;
  external_user_name?: string;
  is_handoff: boolean;
  created_at: string;
  last_message_at: string;
  message_count: number;
}

export interface Message {
  id: string;
  role: string;
  content: string;
  tokens_used: number;
  model_used?: string;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  bot_id: string;
  title: string;
  doc_type: string;
  source_url?: string;
  chunk_count: number;
  status: "processing" | "ready" | "error";
  created_at: string;
}

export interface BroadcastCampaign {
  id: string;
  bot_id: string;
  name: string;
  message: string;
  platform: string;
  target_count: number;
  sent_count: number;
  failed_count: number;
  status: "draft" | "sending" | "completed" | "failed";
  created_at: string;
}

export interface BroadcastCreatePayload {
  name: string;
  message: string;
  platform: "all" | "line" | "facebook";
}

export interface DailyMessageStat {
  date: string;
  count: number;
}

export interface AnalyticsData {
  total_messages: number;
  total_conversations: number;
  messages_by_platform: Record<string, number>;
  daily_messages: DailyMessageStat[];
  top_questions: { question: string; count: number }[];
}

export default api;
