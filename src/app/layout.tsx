
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

declare global {
  interface Window {
    recaptchaVerifier?: any;
    grecaptcha?: any;
  }
}

export const metadata: Metadata = {
  title: "Kalyan Winner",
  description: "Play, check results, and analyze trends for Kalyan Matka.",
  icons: {
    icon: "/kalyanwinnerfavicon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(var(--background))" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(var(--background))" },
  ],
};


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
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
