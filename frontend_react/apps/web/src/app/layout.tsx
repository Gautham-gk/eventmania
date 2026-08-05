import type { Metadata } from "next";
// ─────────────────────────────────────────────────────────────────────────────
//  APP FONT — single source of truth for the entire site's typeface.
//  To swap the font, change ONLY these two things:
//    1. the import below (e.g. `import { Inter } from "next/font/google"`)
//    2. the loader call below (`Roboto({ ... })` → `Inter({ ... })`)
//  Everything else inherits automatically via the `--font-app` CSS variable.
// ─────────────────────────────────────────────────────────────────────────────
import { Roboto } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { ChatPresence } from "@/components/ChatPresence";
import { NO_FLASH_SCRIPT } from "@/lib/theme";
import "@/lib/api-config";
import "./globals.css";

const appFont = Roboto({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  title: "NewFind — Discover Events & Communities",
  description:
    "AI-powered platform to discover events, communities, and experiences near you.",
  applicationName: "NewFind",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon-180.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "NewFind — Discover Events & Communities",
    description:
      "AI-powered platform to discover events, communities, and experiences near you.",
    siteName: "NewFind",
    type: "website",
    images: [
      {
        url: "/brand/newfind-og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "NewFind",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NewFind — Discover Events & Communities",
    description:
      "AI-powered platform to discover events, communities, and experiences near you.",
    images: ["/brand/newfind-og-1200x630.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${appFont.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Sets data-theme before first paint so there's no light→dark flash. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <QueryProvider>
            {children}
            {/* Invisible: lights the navbar chat button on new messages. */}
            <ChatPresence />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}