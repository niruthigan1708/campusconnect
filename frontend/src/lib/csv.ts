import { RegistrationResponse } from "./types";

export function exportRegistrationsToCsv(
  registrations: RegistrationResponse[],
  eventTitle: string
) {
  if (!registrations || registrations.length === 0) return;

  const headers = ["Registration ID", "Student Name", "Student Email", "Registered At", "Event Title"];
  const rows = registrations.map((r) => [
    r.id,
    `"${r.studentName.replace(/"/g, '""')}"`,
    `"${r.studentEmail.replace(/"/g, '""')}"`,
    `"${new Date(r.registeredAt).toLocaleString()}"`,
    `"${(r.eventTitle || eventTitle).replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const sanitizedTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  link.setAttribute("download", `${sanitizedTitle}-attendees.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
