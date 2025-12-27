
'use client';

import Link from "next/link";
import Image from 'next/image';
import {
  Users,
  ClipboardList,
  LayoutDashboard,
  Wallet,
  Settings,
  Ticket,
  Landmark,
  UserPlus,
  Store,
  Clock,
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
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
        <Sidebar>
            <SidebarHeader className="p-0 px-2">
            <div className="flex items-center justify-center p-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                    <Image src="/kalyanwinnerlogo.png" alt="Kalyan Winner Logo" width={80} height={80} className="object-contain" />
                </Link>
            </div>
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/dashboard">
                    <LayoutDashboard />
                    Dashboard
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/admins">
                    <Users />
                    Admins
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/users">
                    <Users />
                    Users
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-bidding">
                    <Ticket />
                    Manage Bidding
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-bets">
                    <Settings />
                    Manage Bet Types
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-results">
                    <ClipboardList />
                    Manage Results
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-markets">
                    <Store />
                    Manage Markets
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-timings">
                    <Clock />
                    Manage Timings
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/transactions">
                    <Wallet />
                    Transactions
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/bet-ledger">
                    <Ticket />
                    Bet Ledger
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/cash-ledger">
                    <Wallet />
                    Cash Ledger
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/manage-payments">
                    <Landmark />
                    Manage Payments
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Link href="/admin/settings">
                    <Settings />
                    App Settings
                    </Link>
                </SidebarMenuButton>
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
            <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-purple-700 px-4 sm:h-14 sm:px-6">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="text-white"/>
                </div>
                 <div className="flex flex-1 items-center justify-end gap-2">
                    {/* <ThemeToggle /> */}
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 sm:p-6 min-w-0 bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">{children}</main>
            </div>
        </SidebarInset>
        </SidebarProvider>
    );
}

// This component is now more robust and handles all auth edge cases.
function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, "users", user.uid) : null),
    [firestore, user]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    // After all data has loaded, check the conditions.
    if (!isUserLoading && !isUserDataLoading) {
      // If there is no authenticated user, OR
      // If the user document doesn't exist, OR
      // If the user's role is not 'Admin',
      // then redirect to the login page.
      if (!user || !userData || userData.role !== 'Admin') {
        router.replace('/admin');
      }
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  // While any authentication or data fetching is in progress, show a loading screen.
  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">
        <Skeleton className="h-20 w-20 rounded-full bg-white/10" />
      </div>
    );
  }
  
  // Only if all checks pass, render the main admin layout with the page content.
  if (user && userData?.role === 'Admin') {
    return <AdminLayoutContent>{children}</AdminLayoutContent>;
  }

  // In any other case (like during the brief moment before a redirect), 
  // continue showing the loading screen to prevent a blank page flash.
  return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-slate-900">
        <Skeleton className="h-20 w-20 rounded-full bg-white/10" />
      </div>
    );
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the main admin login page, don't use the auth layout.
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  // For all other admin pages, wrap them in the authentication layout.
  return <AdminAuthLayout>{children}</AdminAuthLayout>;
}
