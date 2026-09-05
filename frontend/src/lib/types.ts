export type Role = "STUDENT" | "ORGANIZER" | "ADMIN";

export type EventStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type EventCategory =
  | "TECHNICAL"
  | "CULTURAL"
  | "SPORTS"
  | "WORKSHOP"
  | "SEMINAR"
  | "SOCIAL"
  | "CAREER"
  | "OTHER";

export const EVENT_CATEGORIES: EventCategory[] = [
  "TECHNICAL",
  "CULTURAL",
  "SPORTS",
  "WORKSHOP",
  "SEMINAR",
  "SOCIAL",
  "CAREER",
  "OTHER",
];

export interface AuthResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface EventResponse {
  id: number;
  title: string;
  description: string;
  eventDate: string; // ISO date, e.g. "2026-09-15"
  startTime: string; // "HH:mm:ss"
  endTime: string;
  location: string;
  capacity: number;
  availableSpots: number;
  category: EventCategory;
  status: EventStatus;
  rejectionReason: string | null;
  organizerId: number;
  organizerName: string;
  clubId: number;
  clubName: string;
  isRegistered: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationResponse {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  eventId: number;
  eventTitle: string;
  registeredAt: string;
}

export interface AdminDashboardResponse {
  totalUsers: number;
  totalStudents: number;
  totalOrganizers: number;
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  totalRegistrations: number;
}

export interface UserSummaryResponse {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface ClubResponse {
  id: number;
  name: string;
  description: string;
  contactEmail: string | null;
  organizerId: number;
  organizerName: string;
  organizerEmail: string;
  activeEventsCount: number;
  createdAt: string;
}

export interface ClubRequestPayload {
  name: string;
  description?: string;
  contactEmail?: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: Record<string, string> | null;
}

