import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/app/layout-client";
import { headers } from 'next/headers';
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Kalyan Winner",
  description: "Play, check results, and analyze trends for Kalyan Matka.",
};

function PathnameLayout({ app, children }: { app: React.ReactNode, children: React.ReactNode }) {
  const pathname = headers().get('x-next-pathname');
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
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
            <PathnameLayout 
              app={<AppLayout>{children}</AppLayout>}
            >
              {children}
            </PathnameLayout>
          </Suspense>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
