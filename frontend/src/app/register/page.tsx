"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { roleHomePath } from "@/lib/roles";
import { registerSchema, RegisterFormValues } from "@/lib/validation";
import { ApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "STUDENT",
      clubName: "",
      clubDescription: "",
      clubContactEmail: "",
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    try {
      const auth = await registerUser(values);
      toast.success(`Welcome to CampusConnect, ${auth.name}`);
      router.push(roleHomePath(auth.role));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Join CampusConnect as a student or club organizer</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={() => (
                    <FormItem>
                      <FormLabel>I am a</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => form.setValue("role", "STUDENT")}
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                            role === "STUDENT"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input hover:bg-accent"
                          )}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => form.setValue("role", "ORGANIZER")}
                          className={cn(
                            "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                            role === "ORGANIZER"
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input hover:bg-accent"
                          )}
                        >
                          Club Organizer
                        </button>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@campus.edu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="At least 8 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === "ORGANIZER" && (
                  <div className="space-y-4 rounded-md border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Club details</p>
                    <FormField
                      control={form.control}
                      name="clubName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Club name</FormLabel>
                          <FormControl>
                            <Input placeholder="Debate Society" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clubDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="What does your club do?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clubContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="club@campus.edu" {...field} />
                          </FormControl>
                          <FormDescription>Shown to students viewing your events</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </Form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
