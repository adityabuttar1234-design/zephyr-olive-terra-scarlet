import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ClipboardCheck, Coins, UserRoundSearch } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_MARK, APP_NAME, CAMPUS } from "@/lib/proxy/constants";
import { getPublicStats } from "@/lib/proxy/fns";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { isPending } = useCurrentUserState();
  const [stats, setStats] = useState({ students: 0, open: 0, completed: 0 });

  useEffect(() => {
    void getPublicStats()
      .then(setStats)
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-24">
        <section className="relative grid gap-10 py-12 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div>
            <p className="rise-in font-mono text-[11px] tracking-[0.28em] text-stamp uppercase">
              Hostel notice · {CAMPUS}
            </p>
            <h1 className="rise-in-2 font-display mt-4 max-w-xl text-5xl leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Skip the lecture.
              <br />
              Keep the attendance.
              <span className="italic text-muted-foreground"> Don't be a coward.</span>
            </h1>
            <p className="rise-in-3 mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              {APP_NAME} is {APP_MARK}. Burn one credit, some other sleep-deprived bastard sits in
              your chair, clicks your name, and dumps a photo on Buttar's desk. He checks it
              isn't a bathroom selfie. They get the credit. You keep your CGPA and whatever is
              left of your dignity.
            </p>
            <div className="rise-in-4 mt-8 flex flex-wrap gap-3">
              {isPending ? (
                <div className="h-12 w-40 animate-pulse rounded-md bg-muted" />
              ) : (
                <>
                  <SignedOut>
                    <Button asChild size="lg">
                      <Link to="/signup">
                        Join with Thapar mail
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                      <Link to="/login">I already eat here</Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <Button asChild size="lg">
                      <Link to="/board">
                        Open the board
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                      <Link to="/request">Post a chit</Link>
                    </Button>
                  </SignedIn>
                </>
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              New accounts: @{`thapar.edu`} only. Six-digit slap of truth on that inbox. Gmail kids
              can wait outside.
            </p>
          </div>
          <aside className="relative">
            <div className="paper-chit relative rounded-xl p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
              <p className="font-mono text-[10px] tracking-[0.22em] text-paper-ink/50 uppercase">
                AY 2026–27 · Confidential hostel copy
              </p>
              <h2 className="font-display mt-3 text-3xl text-paper-ink">Proxy permit</h2>
              <ul className="mt-5 space-y-3 text-sm text-paper-ink/80">
                <li>1 credit leaves your locker when you post.</li>
                <li>A volunteer walks into C-block so you don't have to.</li>
                <li>Photo proof. No cropped WhatsApp forwards from 2019.</li>
                <li>Admin stamps it. They get the credit. You get the sleep.</li>
              </ul>
              <div className="stamp-mark absolute right-5 bottom-6 text-[11px]">Approved? Wait.</div>
            </div>
          </aside>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat n={stats.students} label="Bodies in the racket" />
          <Stat n={stats.open} label="Chits on the board" />
          <Stat n={stats.completed} label="Proxies Buttar blessed" />
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          <Step
            icon={Coins}
            title="Post a bunk"
            copy="Course, slot, room. One credit gone. If nobody picks it up you can kill it and the credit crawls back."
          />
          <Step
            icon={UserRoundSearch}
            title="Sit in, you saint"
            copy="Grab an open chit. Attend like you actually enrolled. Click their name. Don't be a spineless little shit and flake."
          />
          <Step
            icon={ClipboardCheck}
            title="Proof, then payday"
            copy="Upload the photo. Buttar looks at it with those tired admin eyes. Stamp lands, credit lands. That's the whole religion."
          />
        </section>

        <section className="mt-16 rounded-xl border border-border bg-card p-6 sm:p-8">
          <h2 className="font-display text-2xl">Rules, you harami</h2>
          <div className="mt-4 grid gap-4 text-sm leading-relaxed text-muted-foreground md:grid-cols-2">
            <p>
              Only @{`thapar.edu`} mail. We send a code there, you type it, then the account exists.
              Trying to recreate the admin desk will get you laughed out of Patiala. The lock is{" "}
              <span className="text-foreground">123adminbuttar</span> and it stays that way.
            </p>
            <p>
              Don't accept your own chit, narcissist. Don't upload a mirror selfie from
              Hostel J and call it C-block. If the photo is ass, it bounces, you shoot again. Credits
              are the only currency. There is no INR, no UPI, no “bhai ek kaam kar de”.
            </p>
          </div>
        </section>

        <footer className="mt-16 flex flex-col gap-2 border-t border-border py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {APP_NAME} · not an official {CAMPUS} portal, thank god.
          </p>
          <Link to="/admin" className="hover:text-foreground">
            Faculty / admin door
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="font-display text-3xl tabular-nums">{n}</p>
      <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Coins;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="size-5 text-stamp" />
      <h3 className="mt-3 text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p>
    </div>
  );
}
