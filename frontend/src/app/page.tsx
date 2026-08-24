import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarCheck, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Discover and manage campus events, all in one place
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            CampusConnect connects students with events hosted by university clubs and
            societies, and gives organizers and admins the tools to run them.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CalendarCheck className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2">For Students</CardTitle>
                <CardDescription>
                  Browse approved events, register in a click, and track everything
                  you&apos;ve signed up for from one dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2">For Organizers</CardTitle>
                <CardDescription>
                  Create events for your club, track registrations, and see your
                  event pipeline from pending to approved.
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
            <Card>
              <CardHeader>
                <ShieldCheck className="h-6 w-6 text-primary" />
                <CardTitle className="mt-2">For Admins</CardTitle>
                <CardDescription>
                  Review and approve events before they go live, and keep an eye on
                  platform-wide activity from a single dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        CampusConnect &middot; University Event & Club Management System
      </footer>
    </div>
  );
}
