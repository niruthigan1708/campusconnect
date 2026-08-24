"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Role, UserSummaryResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { humanize } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

const ROLE_FILTERS: { value: Role | "ALL"; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "STUDENT", label: "Students" },
  { value: "ORGANIZER", label: "Organizers" },
  { value: "ADMIN", label: "Admins" },
];

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [users, setUsers] = useState<UserSummaryResponse[] | null>(null);

  useEffect(() => {
    adminApi
      .listUsers(roleFilter === "ALL" ? undefined : roleFilter)
      .then(setUsers)
      .catch(() => toast.error("Couldn't load users."));
  }, [roleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Everyone registered on the platform</p>
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | "ALL")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTERS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {users === null ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{humanize(u.role)}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt.slice(0, 10))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
