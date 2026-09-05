import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CalendarCheck,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Compass,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-28">
          {/* Subtle Ambient Background Glows */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute top-60 right-10 -z-10 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="pointer-events-none absolute top-80 left-10 -z-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm mb-6 animate-in fade-in zoom-in duration-500">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>The Next-Gen University Event & Club Hub</span>
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.15]">
              Experience Campus Life,{" "}
              <span className="gradient-heading">All in One Place.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              From hackathons and cultural galas to sports leagues and career fairs.
              Browse events, register in one click, and manage student clubs with ease.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="h-12 px-6 text-base font-semibold shadow-lg glow-primary gap-2">
                <Link href="/events">
                  <Compass className="h-5 w-5" />
                  Explore Events
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base font-medium border-border/80 hover:bg-accent/60 gap-2">
                <Link href="/clubs">
                  <Building2 className="h-5 w-5 text-primary" />
                  Browse Clubs
                </Link>
              </Button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="mx-auto mt-16 max-w-4xl grid grid-cols-2 gap-4 rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-md shadow-sm sm:grid-cols-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">100%</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Free for Students</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Instant</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">1-Click RSVP</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Live</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Capacity Tracking</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Verified</p>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">Admin Approved</p>
              </div>
            </div>
          </div>
        </section>

        {/* Roles Feature Section */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tailored for Everyone on Campus
            </h2>
            <p className="mt-2 text-muted-foreground">
              Powerful tools designed for students, club leaders, and university administration.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Students Card */}
            <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/50 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/40">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardHeader className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-2">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">For Students</CardTitle>
                <CardDescription className="text-sm">
                  Discover approved events, reserve your spot instantly, sync with Google Calendar, and manage all your tickets in one place.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Category-based filtering & instant search</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Google Calendar & iCal (.ics) exports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Personal student dashboard</span>
                </div>
              </CardContent>
            </Card>

            {/* Organizers Card */}
            <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/50 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/40">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-purple-500 to-pink-500" />
              <CardHeader className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-2">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">For Organizers</CardTitle>
                <CardDescription className="text-sm">
                  Represent your club, submit event proposals, monitor real-time attendee RSVPs, and export attendee lists for smooth check-ins.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Comprehensive club profile showcase</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>1-Click attendee CSV exports</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Event lifecycle & cancellation workflow</span>
                </div>
              </CardContent>
            </Card>

            {/* Admins Card */}
            <Card className="relative overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/50 shadow-md transition-all duration-300 hover:shadow-xl hover:border-primary/40">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">For Admins</CardTitle>
                <CardDescription className="text-sm">
                  Review and moderate submitted events before they go public, inspect platform statistics, and manage registered campus users.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>1-Click event approval and feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Platform-wide metrics dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>User role auditing & club management</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/90 via-indigo-600 to-primary p-8 sm:p-12 text-center text-primary-foreground shadow-2xl glow-primary">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Dive into Campus Events?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90 text-sm sm:text-base">
              Join thousands of students and dozens of societies organizing workshops, competitions, socials, and festivals.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="font-bold shadow-md">
                <Link href="/register">Create Your Account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10">
                <Link href="/events">Browse All Events</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/40 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>CampusConnect</span>
            <span className="text-muted-foreground font-normal">&middot; University Event & Club Management System</span>
          </div>
          <div>
            Built with modern Next.js 16 & Spring Boot
          </div>
        </div>
      </footer>
    </div>
  );
}
