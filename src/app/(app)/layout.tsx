
'use client';

import Link from "next/link";
import Image from 'next/image';
import {
  LayoutDashboard,
  Wallet,
  Ticket,
  ClipboardList,
  GanttChartSquare,
  HelpCircle,
  Coins,
  Clock,
  Trophy,
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import NotificationBell from "@/components/NotificationBell";

function NavLinks() {
  return (
    <nav className="flex flex-col gap-2 p-2">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </Link>
      <Link href="/play" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Ticket className="h-4 w-4" />
        Play
      </Link>
      <Link href="/game-timings" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Clock className="h-4 w-4" />
        Game Timings
      </Link>
      <Link href="/leaderboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Trophy className="h-4 w-4" />
        Leaderboard
      </Link>
      <Link href="/results" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <ClipboardList className="h-4 w-4" />
        Results
      </Link>
      <Link href="/panel-chart" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <GanttChartSquare className="h-4 w-4" />
        Panel Chart
      </Link>
      <Link href="/wallet" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Wallet className="h-4 w-4" />
        Wallet
      </Link>
      <Link href="/analysis" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <GanttChartSquare className="h-4 w-4" />
        Analysis
      </Link>
      <Link href="/rates" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <Coins className="h-4 w-4" />
        Rates
      </Link>
      <Link href="/faq" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
        <HelpCircle className="h-4 w-4" />
        FAQ
      </Link>
      <div className="p-2">
         <NotificationBell />
      </div>
    </nav>
  );
}

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center justify-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
            </Link>
          </div>
          <div className="flex-1 overflow-auto">
            <NavLinks />
          </div>
          <div className="mt-auto p-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <SheetHeader>
                <SheetTitle className="sr-only">Main Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigation links for the application.
                </SheetDescription>
              </SheetHeader>
              <div className="flex h-14 items-center justify-center border-b">
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                   <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
                 </Link>
              </div>
              <NavLinks />
              <div className="mt-auto p-4">
                <UserNav />
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    // If auth state is determined and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.replace("/login");
    }
    // If user data is loaded and the user doesn't have the 'User' role, redirect
    if (!isUserDataLoading && userData && userData.role !== 'User') {
        router.replace('/login');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  // While checking auth or user data, show a loading state
  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  // If user is logged in and has the correct role, render the layout
  if (user && userData?.role === 'User') {
    return <AppLayoutContent>{children}</AppLayoutContent>;
  }

  // In all other cases (e.g., redirecting), render nothing
  return null;
}
