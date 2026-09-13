import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { RedirectToSignIn, SignedIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isReservedIdentity, isThaparEmail } from "@/lib/proxy/constants";
import { errMsg } from "@/lib/utils";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <div className="mx-auto mt-20 h-48 max-w-sm animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }
  if (user) {
    return <RedirectToSignIn to="/board" />;
  }

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <p className="font-mono text-[11px] tracking-[0.22em] text-stamp uppercase">Student door</p>
        <h1 className="font-display mt-2 text-4xl">Log in, then bunk.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Thapar mail only. If you're looking for the throne, use the admin door like a civilized
          tyrant.
        </p>
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (isReservedIdentity(email)) {
              toast.error("Admin doesn't sneak in this door.");
              return;
            }
            if (!isThaparEmail(email)) {
              toast.error("That's not @thapar.edu. Out.");
              return;
            }
            setBusy(true);
            try {
              const { error } = await authClient.signIn.email({
                email: email.trim().toLowerCase(),
                password,
                callbackURL: "/board",
              });
              if (error) throw new Error(error.message ?? "Login died.");
              await navigate({ to: "/board" });
            } catch (err) {
              toast.error(errMsg(err, "Wrong mail or password. Or both. Classic."));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Thapar email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="first.last@thapar.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Opening the locker…" : "Let me in"}
          </Button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
            Get a code on @thapar.edu
          </Link>
        </p>
        <SignedIn>
          <span className="sr-only">signed in</span>
        </SignedIn>
      </main>
    </div>
  );
}
