import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@timesheet/ui/components/sonner";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

import "../index.css";

export type RouterAppContext = Record<string, never>;

const RootComponent = () => (
  <>
    <HeadContent />
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div className="relative flex min-h-svh flex-col bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary">
        {/* Elegant blur background */}
        <div className="fixed inset-0 -z-10 bg-background" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_100%_100%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />
        
        <Header />
        
        <main className="flex-1 pb-28 md:pb-8 pt-4 md:pt-8 w-full">
          <Outlet />
        </main>
      </div>
      <Toaster richColors closeButton position="top-center" theme="system" />
    </ThemeProvider>
    <TanStackRouterDevtools position="bottom-left" />
  </>
);

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    links: [
      {
        href: "/favicon.ico",
        rel: "icon",
      },
    ],
    meta: [
      {
        title: "Timesheet",
      },
      {
        content: "Gestiona tus horas de trabajo de forma elegante",
        name: "description",
      },
      {
        name: "theme-color",
        content: "#000000",
        media: "(prefers-color-scheme: dark)",
      },
      {
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
    ],
  }),
});
