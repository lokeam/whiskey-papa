import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import { MetricsProvider } from "@/app/providers/MetricsProvider";
import { BreadcrumbProvider } from "@/app/providers/BreadCrumbContext";
import { ClientLayout } from "@/app/providers/ClientLayout";


const dmMono = DM_Mono({
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "Whiskey Papa - Hatchet Workflow Demo",
  description: "Workflow dashboard demo for Hatchet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${dmMono.variable} antialiased text-foreground`}>
        <MetricsProvider>
          <BreadcrumbProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </BreadcrumbProvider>
        </MetricsProvider>
      </body>
    </html>
  );
}
