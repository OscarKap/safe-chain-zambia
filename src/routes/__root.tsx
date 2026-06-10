import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SplashScreen } from "@/components/SplashScreen";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AuthProvider } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-brand font-semibold">404</p>
        <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <a href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please try again or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >Try again</button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Safe Chain — Youth SRHR support in Zambia" },
      { name: "description", content: "Safe Chain is a youth-led platform for sexual and reproductive health, safe anonymous reporting, clinic finders, and community accountability in Zambia." },
      { name: "theme-color", content: "#0f7d76" },
      { property: "og:title", content: "Safe Chain — Youth SRHR support in Zambia" },
      { property: "og:description", content: "Safe Chain is a youth-led platform for sexual and reproductive health, safe anonymous reporting, clinic finders, and community accountability in Zambia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Safe Chain — Youth SRHR support in Zambia" },
      { name: "twitter:description", content: "Safe Chain is a youth-led platform for sexual and reproductive health, safe anonymous reporting, clinic finders, and community accountability in Zambia." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1555f514-fc06-4332-b825-f3890f4e9e2c/id-preview-0c6ad0f0--0215b440-adf6-40af-9380-3fde90bb29d8.lovable.app-1779436593144.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1555f514-fc06-4332-b825-f3890f4e9e2c/id-preview-0c6ad0f0--0215b440-adf6-40af-9380-3fde90bb29d8.lovable.app-1779436593144.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SplashScreen />
        <div className="min-h-dvh flex flex-col">
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 z-50 rounded bg-primary px-3 py-2 text-sm text-primary-foreground">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1 pb-20 md:pb-0">
            <Outlet />
          </main>
          <SiteFooter />
          <MobileBottomNav />
        </div>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
