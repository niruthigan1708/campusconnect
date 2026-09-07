import {
  AdminDashboardResponse,
  ApiErrorResponse,
  AuthResponse,
  EventCategory,
  EventResponse,
  PageResponse,
  RegistrationResponse,
  Role,
  UserSummaryResponse,
} from "./types";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const AUTH_STORAGE_KEY = "campusconnect_auth";

// Uploaded images are returned as paths relative to the backend (e.g. "/uploads/clubs/x.png");
// this resolves them to a fully-qualified URL the browser can actually load.
export function toAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}

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

// Concurrent 401s share one in-flight refresh call: the refresh token rotates
// on every use, so two simultaneous calls racing to spend the same token would
// leave the loser permanently logged out.
let refreshPromise: Promise<AuthResponse | null> | null = null;

function refreshAuth(): Promise<AuthResponse | null> {
  const current = getStoredAuth();
  if (!current?.refreshToken) return Promise.resolve(null);

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const auth = (await res.json()) as AuthResponse;
        setStoredAuth(auth);
        return auth;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const auth = getStoredAuth();
  // FormData bodies (file uploads) must NOT get a manual Content-Type - fetch sets
  // its own multipart boundary automatically, and overriding it breaks parsing.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(auth ? { Authorization: `Bearer ${auth.token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !isRetry && !path.startsWith("/api/auth/") && auth) {
    const refreshed = await refreshAuth();
    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }
    setStoredAuth(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("campusconnect:session-expired"));
    }
  }

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

  logout: (refreshToken: string) =>
    apiFetch<void>("/api/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) }),

  forgotPassword: (email: string) =>
    apiFetch<void>("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  resetPassword: (token: string, newPassword: string) =>
    apiFetch<void>("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, newPassword }) }),
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
  listApproved: (params?: { category?: EventCategory; search?: string; page?: number; size?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.search) query.set("search", params.search);
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 12));
    return apiFetch<PageResponse<EventResponse>>(`/api/events?${query}`);
  },

  getById: (id: number | string) => apiFetch<EventResponse>(`/api/events/${id}`),

  listMine: () => apiFetch<EventResponse[]>("/api/events/my"),

  create: (payload: EventRequestPayload) =>
    apiFetch<EventResponse>("/api/events", { method: "POST", body: JSON.stringify(payload) }),

  update: (id: number | string, payload: EventRequestPayload) =>
    apiFetch<EventResponse>(`/api/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  uploadBanner: (id: number | string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<EventResponse>(`/api/events/${id}/banner`, { method: "POST", body: formData });
  },

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
  uploadMyClubLogo: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<import("./types").ClubResponse>("/api/clubs/my/logo", { method: "POST", body: formData });
  },
};

export const adminApi = {
  dashboard: () => apiFetch<AdminDashboardResponse>("/api/admin/dashboard"),

  listUsers: (role?: Role, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (role) params.set("role", role);
    return apiFetch<PageResponse<UserSummaryResponse>>(`/api/admin/users?${params}`);
  },

  listPendingEvents: () => apiFetch<EventResponse[]>("/api/admin/events/pending"),

  listAllEvents: (status?: EventResponse["status"], page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) params.set("status", status);
    return apiFetch<PageResponse<EventResponse>>(`/api/admin/events?${params}`);
  },

  setUserActive: (id: number | string, active: boolean) =>
    apiFetch<UserSummaryResponse>(`/api/admin/users/${id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),

  updateUserRole: (id: number | string, role: Role) =>
    apiFetch<UserSummaryResponse>(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
};

