import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
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
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="vite-ui-theme"
    >
      <div className="flex min-h-svh flex-col bg-background text-foreground font-sans antialiased selection:bg-primary/30 selection:text-foreground">
        <Header />

        {/* Main content area */}
        <main className="flex-1 w-full flex flex-col pt-16 md:pt-20 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
      <Toaster richColors closeButton position="bottom-center" theme="system" />
    </ThemeProvider>
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
        content: "Timesheet Management",
        name: "description",
      },
      {
        content: "#faf8f5",
        media: "(prefers-color-scheme: light)",
        name: "theme-color",
      },
      {
        content: "#1a1f2e",
        media: "(prefers-color-scheme: dark)",
        name: "theme-color",
      },
    ],
  }),
});
