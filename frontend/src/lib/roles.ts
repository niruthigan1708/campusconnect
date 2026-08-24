import { Role } from "./types";

export function roleHomePath(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "ORGANIZER":
      return "/organizer/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
  }
}
