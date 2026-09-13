import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, AuthGateSkeleton, NeedAccount } from "@/components/app-shell";
import { RequestCard } from "@/components/request-card";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMe } from "@/components/use-me";
import { acceptRequest, listBoard } from "@/lib/proxy/fns";
import type { ProxyCard } from "@/lib/proxy/types";
import { errMsg } from "@/lib/utils";

export const Route = createFileRoute("/board")({ component: BoardPage });

function BoardPage() {
  const { user, isPending } = useCurrentUserState();
  const { profile, loading, reload } = useMe();
  const [cards, setCards] = useState<ProxyCard[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    void listBoard()
      .then(setCards)
      .catch((e) => toast.error(errMsg(e)));
  }, [user]);

  if (isPending || (user && loading && !profile)) return <AuthGateSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) {
    return (
      <NeedAccount>
        <Button asChild>
          <Link to="/signup">Join with Thapar mail</Link>
        </Button>
      </NeedAccount>
    );
  }

  return (
    <AppShell profile={profile}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-stamp uppercase">Live board</p>
          <h1 className="font-display mt-1 text-3xl">Who needs a body in the chair?</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Grab a chit, show up, photograph the crime, wait for Buttar. One credit if the photo
            isn't garbage.
          </p>
        </div>
        <Button asChild>
          <Link to="/request">I need a proxy</Link>
        </Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards === null ? (
          <>
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          </>
        ) : cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground sm:col-span-2">
            Nobody needs a proxy right now. Either the whole campus grew a spine or it's a
            Sunday. Post a request and stop standing there like a lost first-year.
          </div>
        ) : (
          cards.map((card) => (
            <RequestCard
              key={card.id}
              card={card}
              href={`/job/${card.id}`}
              action={
                <Button
                  size="sm"
                  className="w-full"
                  disabled={busyId === card.id}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBusyId(card.id);
                    try {
                      await acceptRequest({ data: { id: card.id } });
                      toast.success("It's yours. Don't flake, saint.");
                      setCards((c) => (c ?? []).filter((x) => x.id !== card.id));
                      await reload();
                    } catch (err) {
                      toast.error(errMsg(err));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  I'll sit in
                </Button>
              }
            />
          ))
        )}
      </div>
    </AppShell>
  );
}
