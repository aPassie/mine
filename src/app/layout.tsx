import type { Metadata, Viewport } from "next";
import { PWA } from "@/components/PWA";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mine — your second brain",
  description: "A quiet place for your ideas, reminders, and wishes.",
  applicationName: "Mine",
  appleWebApp: {
    capable: true,
    title: "Mine",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {children}
        <PWA />
      </body>
    </html>
  );
}
