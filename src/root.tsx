import React, { useEffect, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import Topbar from "@/components/ui/Topbar";
import Footer from "@/components/ui/Footer";
import { usePageTracking } from "@/hooks/usePageTracking";
import { initGA } from "@/lib/analytics";
import i18n from "@/i18n";

// Routes that own their full layout (no global header/footer)
const FULL_LAYOUT_ROUTES = ["/auth"];

// Favicon: emoji SVG data URI — constructed programmatically so the emoji
// character does not appear as a raw string literal in source (per CONTRIBUTING.md).
// 0x1F3E0 = house emoji; this value is intentional and load-bearing.
const HOUSE_EMOJI = String.fromCodePoint(0x1f3e0);
const FAVICON_HREF = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>${encodeURIComponent(HOUSE_EMOJI)}</text></svg>`;

function PageTracker() {
  usePageTracking();
  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AiSumai (愛住) - Compare Homes in Japan with AI & Experts</title>
        <meta
          name="description"
          content="AiSumai (愛住) helps renters and home buyers in Japan compare two homes side by side with AI analysis, expert insights, and community wisdom."
        />
        <meta name="author" content="AiSumai (愛住)" />

        <meta
          property="og:title"
          content="AiSumai (愛住) - Compare Homes in Japan with AI & Experts"
        />
        <meta
          property="og:description"
          content="AiSumai (愛住) helps renters and home buyers in Japan compare two homes side by side with AI analysis, expert insights, and community wisdom."
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://qditnqwrjioypsuxwagg.supabase.co/storage/v1/object/public/public-image/og-image.jpeg"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content="https://qditnqwrjioypsuxwagg.supabase.co/storage/v1/object/public/public-image/og-image.jpeg"
        />

        {/* emoji-SVG favicon — href constructed programmatically (see FAVICON_HREF above) */}
        <link rel="icon" href={FAVICON_HREF} />

        {/* Google Analytics — literal src tag required by analytics.ts:21 querySelector */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-F9W7PNKJSN"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-F9W7PNKJSN');
`,
          }}
        />

        <Meta />
        <Links />
      </head>
      <body>
        {children}
        {/* IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS VERY COMMENT! */}
        <script type="module" src="https://cdn.gpteng.co/gptengineer.js"></script>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <title>Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h1>Something went wrong</h1>
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const [queryClient] = useState(() => new QueryClient());
  const location = useLocation();
  const isFullLayout = FULL_LAYOUT_ROUTES.some((p) =>
    location.pathname.startsWith(p)
  );

  useEffect(() => {
    initGA();
  }, []);

  // Post-hydration language upgrade: runs AFTER React has hydrated the SSR HTML,
  // so there is no text-node mismatch. Reads the same detection order as i18n.ts
  // (localStorage → navigator), normalizes to a supported lang, and upgrades if
  // the detected locale differs from the server-default "en".
  useEffect(() => {
    const stored = localStorage.getItem("i18nextLng");
    const preferred = stored || navigator.language || "";
    const detected = preferred.startsWith("ja") ? "ja" : "en";
    if (detected !== i18n.language) {
      i18n.changeLanguage(detected);
    }
  }, []);

  return (
    <HelmetProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <PageTracker />
          <div className="min-h-screen bg-paper text-ink flex flex-col">
            {!isFullLayout && <Topbar />}
            <main className="flex-1">
              <Outlet />
            </main>
            {!isFullLayout && <Footer />}
          </div>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
