
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
} from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import NotificationBell from "@/components/NotificationBell";

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-0 px-2">
          <div className="flex items-center justify-center p-4">
             <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/play">
                  <Ticket />
                  Play
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/game-timings">
                  <Clock />
                  Game Timings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/leaderboard">
                  <Trophy />
                  Leaderboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/results">
                  <ClipboardList />
                  Results
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/panel-chart">
                  <GanttChartSquare />
                  Panel Chart
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/wallet">
                  <Wallet />
                  Wallet
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/analysis">
                  <GanttChartSquare />
                  Analysis
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/rates">
                  <Coins />
                  Rates
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/faq">
                  <HelpCircle />
                  FAQ
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <NotificationBell />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mb-4">
          <SidebarSeparator />
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-dvh">
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:h-14 sm:px-6">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex flex-1 items-center justify-end gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
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
