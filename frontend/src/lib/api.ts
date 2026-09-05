import {
  AdminDashboardResponse,
  ApiErrorResponse,
  AuthResponse,
  EventCategory,
  EventResponse,
  RegistrationResponse,
  Role,
  UserSummaryResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const AUTH_STORAGE_KEY = "campusconnect_auth";

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string> | null;

  constructor(message: string, status: number, fieldErrors: Record<string, string> | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function getStoredAuth(): AuthResponse | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthResponse | null) {
  if (typeof window === "undefined") return;
  if (auth) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getStoredAuth();
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse | null;
    throw new ApiError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      response.status,
      errorBody?.fieldErrors ?? null
    );
  }

  return body as T;
}

export const authApi = {
  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: Role;
    clubName?: string;
    clubDescription?: string;
    clubContactEmail?: string;
  }) => apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
};

export interface EventRequestPayload {
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  category: EventCategory;
}

export const eventsApi = {
  listApproved: (params?: { category?: EventCategory; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return apiFetch<EventResponse[]>(`/api/events${qs ? `?${qs}` : ""}`);
  },

  getById: (id: number | string) => apiFetch<EventResponse>(`/api/events/${id}`),

  listMine: () => apiFetch<EventResponse[]>("/api/events/my"),

  create: (payload: EventRequestPayload) =>
    apiFetch<EventResponse>("/api/events", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: number | string, payload: EventRequestPayload) =>
    apiFetch<EventResponse>(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  cancel: (id: number | string) =>
    apiFetch<EventResponse>(`/api/events/${id}/cancel`, { method: "POST" }),

  remove: (id: number | string) => apiFetch<void>(`/api/events/${id}`, { method: "DELETE" }),

  approve: (id: number | string) => apiFetch<EventResponse>(`/api/events/${id}/approve`, { method: "POST" }),

  reject: (id: number | string, reason?: string) =>
    apiFetch<EventResponse>(`/api/events/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: reason ?? null }),
    }),

  register: (id: number | string) =>
    apiFetch<RegistrationResponse>(`/api/events/${id}/register`, { method: "POST" }),

  cancelRegistration: (id: number | string) =>
    apiFetch<void>(`/api/events/${id}/register`, { method: "DELETE" }),

  getRegistrations: (id: number | string) =>
    apiFetch<RegistrationResponse[]>(`/api/events/${id}/registrations`),
};

export const registrationsApi = {
  myEvents: () => apiFetch<EventResponse[]>("/api/registrations/my"),
};

export const clubsApi = {
  list: () => apiFetch<import("./types").ClubResponse[]>("/api/clubs"),
  getById: (id: number | string) => apiFetch<import("./types").ClubResponse>(`/api/clubs/${id}`),
  getEvents: (id: number | string) => apiFetch<EventResponse[]>(`/api/clubs/${id}/events`),
  myClub: () => apiFetch<import("./types").ClubResponse>("/api/clubs/my"),
  updateMyClub: (payload: import("./types").ClubRequestPayload) =>
    apiFetch<import("./types").ClubResponse>("/api/clubs/my", { method: "PUT", body: JSON.stringify(payload) }),
};

export const adminApi = {
  dashboard: () => apiFetch<AdminDashboardResponse>("/api/admin/dashboard"),

  listUsers: (role?: Role) =>
    apiFetch<UserSummaryResponse[]>(`/api/admin/users${role ? `?role=${role}` : ""}`),

  listPendingEvents: () => apiFetch<EventResponse[]>("/api/admin/events/pending"),

  listAllEvents: (status?: EventResponse["status"]) =>
    apiFetch<EventResponse[]>(`/api/admin/events${status ? `?status=${status}` : ""}`),
};

