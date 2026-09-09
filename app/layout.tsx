import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import Navbar from "@/components/Core-components/navbar";
import RouteProgressBar from "@/components/route-progress-bar";
import ThemeProvider from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Alaman · Security Point Registry",
    template: "%s · Alaman",
  },
  description:
    "The Alaman security point registry. One incharge account, full access.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen flex flex-col bg-background text-foreground antialiased ${inter.className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RouteProgressBar />
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}