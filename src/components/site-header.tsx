import { Link } from "@tanstack/react-router";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME } from "@/lib/proxy/constants";
import { Button } from "@/components/ui/button";

export function SiteHeader({ credits }: { credits?: number }) {
  const { isPending } = useCurrentUserState();

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-lg tracking-tight">{APP_NAME}</span>
          <span className="hidden text-[10px] tracking-[0.22em] text-muted-foreground uppercase sm:inline">
            Patiala
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {typeof credits === "number" ? (
            <span className="rounded-full border border-border bg-muted px-3 py-1 font-mono text-xs tabular-nums">
              {credits} cr
            </span>
          ) : null}
          {isPending ? (
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          ) : (
            <>
              <SignedOut>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Join the racket</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/board"
                  className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
                >
                  Board
                </Link>
                <UserButton />
              </SignedIn>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
