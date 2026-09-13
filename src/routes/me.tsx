import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, AuthGateSkeleton } from "@/components/app-shell";
import { RequestCard } from "@/components/request-card";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMe } from "@/components/use-me";
import { cancelRequest, listCredits, listMine } from "@/lib/proxy/fns";
import type { CreditEvent, ProxyCard } from "@/lib/proxy/types";
import { errMsg } from "@/lib/utils";

export const Route = createFileRoute("/me")({ component: MePage });

function MePage() {
  const { user, isPending } = useCurrentUserState();
  const { profile, loading, reload } = useMe();
  const [mine, setMine] = useState<ProxyCard[] | null>(null);
  const [ledger, setLedger] = useState<CreditEvent[] | null>(null);
  const [tab, setTab] = useState<"posted" | "gigs" | "credits">("posted");

  useEffect(() => {
    if (!user) return;
    void listMine()
      .then(setMine)
      .catch((e) => toast.error(errMsg(e)));
    void listCredits()
      .then(setLedger)
      .catch(() => undefined);
  }, [user]);

  if (isPending || (user && loading && !profile)) return <AuthGateSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <AuthGateSkeleton />;

  const posted = (mine ?? []).filter((c) => c.requesterId === profile.userId);
  const gigs = (mine ?? []).filter((c) => c.helperId === profile.userId);

  return (
    <AppShell profile={profile}>
      <p className="font-mono text-[11px] tracking-[0.22em] text-stamp uppercase">
        {profile.rollNo} · {profile.branch} {profile.year}
      </p>
      <h1 className="font-display mt-1 text-3xl">{profile.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {profile.email} ·{" "}
        <span className="font-mono tabular-nums text-foreground">{profile.credits}</span> credits in
        the locker
      </p>

      <div className="mt-6 flex gap-2">
        {(
          [
            ["posted", "Posted"],
            ["gigs", "Gigs I took"],
            ["credits", "Ledger"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-10 rounded-full px-4 text-sm ${
              tab === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "credits" ? (
          <ol className="divide-y divide-border rounded-xl border border-border">
            {(ledger ?? []).length === 0 ? (
              <li className="p-5 text-sm text-muted-foreground">No movement yet.</li>
            ) : (
              (ledger ?? []).map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">{e.reason}</p>
                  <span
                    className={`font-mono tabular-nums ${e.delta > 0 ? "text-good" : "text-stamp"}`}
                  >
                    {e.delta > 0 ? "+" : ""}
                    {e.delta}
                  </span>
                </li>
              ))
            )}
          </ol>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(tab === "posted" ? posted : gigs).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground sm:col-span-2">
                Empty. {tab === "posted" ? "Go post a chit if you're scared of class." : "Grab something off the board, saint."}
              </p>
            ) : (
              (tab === "posted" ? posted : gigs).map((card) => (
                <RequestCard
                  key={card.id}
                  card={card}
                  href={`/job/${card.id}`}
                  action={
                    tab === "posted" && card.status === "open" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await cancelRequest({ data: { id: card.id } });
                            toast.success("Killed. Credit crawled back.");
                            setMine((m) =>
                              (m ?? []).map((x) =>
                                x.id === card.id ? { ...x, status: "cancelled" } : x,
                              ),
                            );
                            await reload();
                          } catch (err) {
                            toast.error(errMsg(err));
                          }
                        }}
                      >
                        Kill it, refund me
                      </Button>
                    ) : null
                  }
                />
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
