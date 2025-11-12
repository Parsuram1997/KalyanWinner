import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/app/layout-client";
import AdminLayout from "@/app/admin/layout";
import { headers } from 'next/headers';
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import AdminLoginPage from "./admin/page";

export const metadata: Metadata = {
  title: "Kalyan Winner",
  description: "Play, check results, and analyze trends for Kalyan Matka.",
};

function PathnameProvider({ app, admin, adminLogin }: { app: React.ReactNode, admin: React.ReactNode, adminLogin: React.ReactNode }) {
  const pathname = headers().get('x-next-pathname');
  if (pathname === '/admin') {
    return <>{adminLogin}</>;
  }
  if (pathname?.startsWith('/admin')) {
    return <>{admin}</>;
  }
  return <>{app}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div>Loading...</div>}>
            <PathnameProvider 
              app={<AppLayout>{children}</AppLayout>}
              admin={<AdminLayout>{children}</AdminLayout>}
              adminLogin={<AdminLoginPage />}
            />
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
