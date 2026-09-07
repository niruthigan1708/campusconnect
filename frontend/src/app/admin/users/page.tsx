"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi, ApiError } from "@/lib/api";
import { Role, UserSummaryResponse } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { humanize } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { EmptyState } from "@/components/empty-state";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users } from "lucide-react";

const ROLE_FILTERS: { value: Role | "ALL"; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "STUDENT", label: "Students" },
  { value: "ORGANIZER", label: "Organizers" },
  { value: "ADMIN", label: "Admins" },
];

const ROLES: Role[] = ["STUDENT", "ORGANIZER", "ADMIN"];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [users, setUsers] = useState<UserSummaryResponse[] | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pendingId, setPendingId] = useState<number | null>(null);

  function load() {
    adminApi
      .listUsers(roleFilter === "ALL" ? undefined : roleFilter, page)
      .then((data) => {
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      })
      .catch(() => toast.error("Couldn't load users."));
  }

  useEffect(load, [roleFilter, page]);

  function handleRoleFilterChange(value: Role | "ALL") {
    setRoleFilter(value);
    setPage(0);
  }

  function updateUserInList(updated: UserSummaryResponse) {
    setUsers((prev) => prev?.map((u) => (u.id === updated.id ? updated : u)) ?? prev);
  }

  async function handleRoleChange(id: number, role: Role) {
    setPendingId(id);
    try {
      const updated = await adminApi.updateUserRole(id, role);
      updateUserInList(updated);
      toast.success(`Role updated to ${humanize(role)}.`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't update role.");
    } finally {
      setPendingId(null);
    }
  }

  async function handleActiveToggle(id: number, active: boolean) {
    setPendingId(id);
    try {
      const updated = await adminApi.setUserActive(id, active);
      updateUserInList(updated);
      toast.success(active ? "Account reactivated." : "Account deactivated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't update account status.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Everyone registered on the platform</p>
        </div>
        <Select value={roleFilter} onValueChange={(v) => handleRoleFilterChange(v as Role | "ALL")}>
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
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="sm:w-[20%]">Name</TableHead>
                <TableHead className="hidden sm:table-cell sm:w-[22%]">Email</TableHead>
                <TableHead className="sm:w-[16%]">Role</TableHead>
                <TableHead className="sm:w-[12%]">Status</TableHead>
                <TableHead className="hidden sm:table-cell sm:w-[12%]">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="max-w-32 font-medium sm:max-w-none">
                      {u.name}
                      <p className="truncate text-xs text-muted-foreground sm:hidden">{u.email}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell>
                      {isSelf ? (
                        <Badge variant="outline">{humanize(u.role)}</Badge>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u.id, v as Role)}
                          disabled={pendingId === u.id}
                        >
                          <SelectTrigger className="h-8 w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {humanize(r)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.active ? "secondary" : "destructive"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(u.createdAt.slice(0, 10))}</TableCell>
                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : u.active ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={pendingId === u.id}>
                              Deactivate
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deactivate {u.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                They&apos;ll immediately lose access to their account until reactivated.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleActiveToggle(u.id, false)}>
                                Deactivate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pendingId === u.id}
                          onClick={() => handleActiveToggle(u.id, true)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
