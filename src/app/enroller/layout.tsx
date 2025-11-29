'use client';

import Link from "next/link";
import Image from 'next/image';
import {
  Users,
  LayoutDashboard,
  Coins,
  Clock,
  Wallet,
  Store,
  HelpCircle,
  Landmark,
  ArrowDown,
  Share2,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import NotificationBell from "@/components/NotificationBell";
import ShareButton from "@/components/ShareButton";

function EnrollerLayoutContent({ children }: { children: React.ReactNode }) {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const enrollerRef = useMemoFirebase(() => (authUser ? doc(firestore, "users", authUser.uid) : null), [firestore, authUser]);
    const { data: enroller } = useDoc<any>(enrollerRef);
    
    return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-0 px-2">
          <div className="flex items-center justify-center p-4">
             <Link href="/enroller/dashboard" className="flex items-center gap-2 font-semibold">
                <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/enroller/dashboard">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/enroller/users">
                  <Users />
                  Enrolled Users
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton isSubmenu>
                <Wallet />
                Wallet
              </SidebarMenuButton>
               <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/enroller/wallet">
                        Bonus Wallet
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                   <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                       <Link href="/enroller/wallet/withdraw">
                        Withdraw
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link href="/enroller/wallet/account">
                        Account
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <ShareButton enrollerId={enroller?.customId} />
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/enroller/active-markets">
                  <Store />
                  Active Markets
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/enroller/game-timings">
                  <Clock />
                  Game Timings
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/enroller/game-rates">
                  <Coins />
                  Game Rates
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/enroller/faq">
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
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-14 sm:px-6">
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

function EnrollerAuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/enroller");
    }
     if (!isUserDataLoading && userData && userData.role !== 'Enroller') {
        router.replace('/enroller');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }

  if (user && userData?.role === 'Enroller') {
    return <EnrollerLayoutContent>{children}</EnrollerLayoutContent>;
  }

  return null;
}

export default function EnrollerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/enroller') {
    return <>{children}</>;
  }
  
  return <EnrollerAuthLayout>{children}</EnrollerAuthLayout>;
}
