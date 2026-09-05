"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { clubsApi, ApiError } from "@/lib/api";
import { ClubResponse } from "@/lib/types";
import { clubSchema, ClubFormValues } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Building2, Calendar, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";

export default function ClubProfilePage() {
  const [club, setClub] = useState<ClubResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubSchema),
    defaultValues: { name: "", description: "", contactEmail: "" },
  });

  useEffect(() => {
    clubsApi
      .myClub()
      .then((data) => {
        setClub(data);
        form.reset({
          name: data.name,
          description: data.description ?? "",
          contactEmail: data.contactEmail ?? "",
        });
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Couldn't load your club profile.");
        }
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: ClubFormValues) {
    try {
      const updated = await clubsApi.updateMyClub({
        name: values.name,
        description: values.description || undefined,
        contactEmail: values.contactEmail || undefined,
      });
      setClub(updated);
      toast.success("Club profile updated.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't update your club profile.");
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Club Profile</h1>
          <p className="text-muted-foreground">Manage your club&apos;s public information</p>
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Club Profile</h1>
          <p className="text-muted-foreground">
            No club is registered to your account. Contact an administrator for help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Club Profile</h1>
        <p className="text-muted-foreground">
          This information is shown on the public club directory and your event pages.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>{club?.name}</CardTitle>
            <CardDescription className="flex items-center gap-3">
              {club?.activeEventsCount !== undefined && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {club.activeEventsCount} Active Event{club.activeEventsCount === 1 ? "" : "s"}
                </Badge>
              )}
              {club?.createdAt && (
                <span className="text-xs text-muted-foreground">
                  Registered {formatDate(club.createdAt.slice(0, 10))}
                </span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="border-t pt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech Society" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} placeholder="What does your club do?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="club@campus.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
