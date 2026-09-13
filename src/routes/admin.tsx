import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveProof,
  getAdminSession,
  getAdminStats,
  listAdminQueue,
  loginAdmin,
  logoutAdmin,
  rejectProof,
} from "@/lib/proxy/admin";
import { setAdminToken } from "@/lib/proxy/admin-client";
import { APP_NAME } from "@/lib/proxy/constants";
import type { AdminQueueItem } from "@/lib/proxy/types";
import { errMsg, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<AdminQueueItem[] | null>(null);
  const [stats, setStats] = useState({ students: 0, open: 0, pending: 0, completed: 0 });
  const [rejectFor, setRejectFor] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const refresh = useCallback(async () => {
    const [q, s] = await Promise.all([listAdminQueue(), getAdminStats()]);
    setQueue(q);
    setStats(s);
  }, []);

  useEffect(() => {
    void getAdminSession()
      .then(async (s) => {
        setAuthed(s.ok);
        if (s.ok) await refresh();
      })
      .catch(() => setAuthed(false))
      .finally(() => setReady(true));
  }, [refresh]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-dvh bg-background">
        <main className="mx-auto max-w-sm px-4 py-20">
          <p className="font-mono text-[11px] tracking-[0.22em] text-stamp uppercase">
            {APP_NAME} · locked desk
          </p>
          <h1 className="font-display mt-2 text-4xl">Buttar only.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This door does not make accounts. It does not forget. If you're a student, you walked
            into the wrong block.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                const res = await loginAdmin({ data: { username, password } });
                setAdminToken(res.token);
                setAuthed(true);
                await refresh();
              } catch (err) {
                toast.error(errMsg(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="u">Handle</Label>
              <Input
                id="u"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p">Password</Label>
              <Input
                id="p"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Checking the lock…" : "Open the desk"}
            </Button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.2em] text-stamp uppercase">Admin desk</p>
            <p className="font-display text-lg leading-none">{APP_NAME}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await logoutAdmin();
              setAdminToken(null);
              setAuthed(false);
              setQueue(null);
            }}
          >
            Lock it
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl">Stamp or bounce.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nobody else sits here. Don't rubber-stamp bathroom selfies.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Mini n={stats.students} l="Students" />
          <Mini n={stats.open} l="Open chits" />
          <Mini n={stats.pending} l="Waiting on you" />
          <Mini n={stats.completed} l="Blessed" />
        </div>

        <div className="mt-8 space-y-6">
          {queue === null ? (
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
          ) : queue.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
              Inbox empty. Either the kids are actually attending or they're too lazy to upload
              proof. Both possible.
            </p>
          ) : (
            queue.map((item) => (
              <article
                key={item.id}
                className="grid gap-5 rounded-xl border border-border bg-card p-4 lg:grid-cols-[1fr_1.1fr]"
              >
                <div>
                  {item.imageData ? (
                    <img
                      src={item.imageData}
                      alt={`Proof for ${item.courseCode}`}
                      className="max-h-[420px] w-full rounded-lg object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                    />
                  ) : (
                    <div className="grid h-48 place-items-center rounded-lg bg-muted text-sm text-muted-foreground">
                      No photo. Bounce it.
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                    {item.courseCode} · {formatDate(item.classDate)} · {item.slot}
                  </p>
                  <h2 className="font-display mt-1 text-2xl">{item.courseName}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.venue} · {item.faculty}
                  </p>
                  <p className="mt-3 text-sm">
                    Requester {item.requesterName} ({item.requesterRoll})
                    <br />
                    Helper {item.helperName} ({item.helperRoll})
                  </p>
                  {item.caption ? (
                    <p className="mt-2 text-sm text-muted-foreground">{item.caption}</p>
                  ) : null}
                  {item.note ? (
                    <p className="mt-2 text-xs text-muted-foreground">Chit note: {item.note}</p>
                  ) : null}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          await approveProof({ data: { id: item.id } });
                          toast.success("Stamped. Credit moved.");
                          await refresh();
                        } catch (e) {
                          toast.error(errMsg(e));
                        }
                      }}
                    >
                      Stamp it
                    </Button>
                    <Button
                      variant="stamp"
                      onClick={() => {
                        setRejectFor(item.id);
                        setReason("");
                      }}
                    >
                      Bounce
                    </Button>
                  </div>
                  {rejectFor === item.id ? (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`r-${item.id}`}>Why is this photo ass?</Label>
                      <Textarea
                        id={`r-${item.id}`}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="That's a corridor. Try the actual lecture hall."
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await rejectProof({ data: { id: item.id, reason } });
                            toast.success("Bounced. They can shoot again.");
                            setRejectFor(null);
                            await refresh();
                          } catch (e) {
                            toast.error(errMsg(e));
                          }
                        }}
                      >
                        Send it back
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function Mini({ n, l }: { n: number; l: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="font-display text-2xl tabular-nums">{n}</p>
      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{l}</p>
    </div>
  );
}
