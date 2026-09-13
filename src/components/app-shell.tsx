import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, LayoutGrid, Plus, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/proxy/types";

const NAV = [
  { to: "/board", label: "Board", icon: LayoutGrid },
  { to: "/request", label: "New chit", icon: Plus },
  { to: "/me", label: "My gigs", icon: ClipboardList },
] as const;

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader credits={profile.credits} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-6 pb-24 lg:pb-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <div className="sticky top-20 space-y-1">
            <p className="px-3 pb-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {profile.rollNo} · {profile.branch}
            </p>
            {NAV.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-lg px-3 text-sm transition-colors duration-150",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            <p className="px-3 pt-6 text-xs leading-relaxed text-muted-foreground">
              One credit out to skip. Sit in, upload proof, wait for Buttar. Then the credit comes back dirtier.
            </p>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-3 px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function AuthGateSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="h-14 border-b border-border" />
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <div className="h-10 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

export function NeedAccount({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <UserRound className="size-8 text-muted-foreground" />
      <h1 className="font-display text-2xl">Sign in first, coward.</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        The board is for Thapar kids with an account. Not for lurkers.
      </p>
      {children}
    </div>
  );
}
