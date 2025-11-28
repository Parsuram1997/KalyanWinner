
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
import { ThemeToggle } from "@/components/theme-toggle";
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
                    <Link href="/admin/enrollers">
                    <UserPlus />
                    Enrollers
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
    );
}

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
    if (!isUserLoading && !user) {
      router.replace("/admin");
    }
    if (!isUserDataLoading && userData && userData.role !== 'Admin') {
        router.replace('/admin');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Skeleton className="h-20 w-20 rounded-full" />
      </div>
    );
  }
  
  if (user && userData?.role === 'Admin') {
    return <AdminLayoutContent>{children}</AdminLayoutContent>;
  }

  return null;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the admin login page, don't apply the layout or auth checks.
  if (pathname === '/admin') {
    return <>{children}</>;
  }

  // For all other admin pages, apply the authentication and layout wrapper.
  return <AdminAuthLayout>{children}</AdminAuthLayout>;
}
