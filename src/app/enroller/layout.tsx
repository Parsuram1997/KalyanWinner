
import Link from "next/link";
import {
  Users,
  LayoutDashboard,
  Coins,
  GanttChartSquare,
  LineChart,
  ListOrdered,
  BarChart,
  Wallet,
  HelpCircle,
  UserPlus,
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
import { headers } from "next/headers";
import EnrollerLoginPage from "./page";

export default function EnrollerLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-next-pathname');

  // A mock auth check. In a real app, you'd check a session.
  const isLoggedIn = pathname !== '/enroller';

  if (!isLoggedIn) {
    return <EnrollerLoginPage />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-start gap-2">
             <UserPlus className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-semibold tracking-tight text-primary">
              Enroller Panel
            </h1>
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
            <SidebarSeparator className="my-2" />
             <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/play">
                  <GanttChartSquare />
                  Play
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/results">
                  <ListOrdered />
                  Results
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/panel-chart">
                  <BarChart />
                  Panel Chart
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
                <Link href="/wallet">
                  <Wallet />
                  Wallet
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/analysis">
                  <LineChart />
                  AI Analysis
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
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-dvh">
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
               <h1 className="text-lg font-semibold">Enroller Panel</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
