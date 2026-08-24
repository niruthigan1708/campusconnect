import { Badge } from "@/components/ui/badge";
import { EventStatus } from "@/lib/types";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<EventStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300",
  CANCELLED: "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
  COMPLETED: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300",
};

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-0 font-medium", STATUS_STYLES[status])}>
      {humanize(status)}
    </Badge>
  );
}
