"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function StudentProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Your account details</p>
      </div>

      <Card className="max-w-md">
        <CardHeader className="flex-row items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <Badge variant="outline" className="mt-1">
              Student
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 border-t pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account ID</p>
            <p className="text-sm font-medium">#{user.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
