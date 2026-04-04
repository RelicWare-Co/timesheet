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
      <div className="flex min-h-svh flex-col bg-background text-foreground font-sans antialiased selection:bg-foreground selection:text-background">
        <Header />
        
        {/* Main content area - brutalist clean padding */}
        <main className="flex-1 w-full flex flex-col pt-14 md:pt-16 pb-16 md:pb-0">
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
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
      {
        name: "theme-color",
        content: "#000000",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  }),
});
