import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mailbox } from "@/components/mailbox";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BRANCHES, YEARS } from "@/lib/proxy/constants";
import { claimVerifiedProfile, requestSignupCode, verifySignupCode } from "@/lib/proxy/fns";
import { errMsg } from "@/lib/utils";

export const Route = createFileRoute("/signup")({ component: Signup });

type Form = {
  name: string;
  rollNo: string;
  branch: string;
  year: string;
  email: string;
  password: string;
};

const empty: Form = {
  name: "",
  rollNo: "",
  branch: "COE",
  year: "2nd",
  email: "",
  password: "",
};

function Signup() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(empty);
  const [step, setStep] = useState<"form" | "code">("form");
  const [mailbox, setMailbox] = useState<{ email: string; code: string; from: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <div className="mx-auto mt-20 h-48 max-w-sm animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }
  if (user) return <RedirectToSignIn to="/board" />;

  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-stamp uppercase">
            New blood · @thapar.edu
          </p>
          <h1 className="font-display mt-2 text-4xl">Get in the racket.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We will not create a damn thing until a six-digit code hits that Thapar inbox. Two starter
            credits. Don't blow them on a lab you were going to bunk anyway.
          </p>

          {step === "form" ? (
            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (form.password.length < 8) {
                  toast.error("Password shorter than 8? Come on.");
                  return;
                }
                setBusy(true);
                try {
                  const res = await requestSignupCode({
                    data: {
                      email: form.email,
                      name: form.name,
                      rollNo: form.rollNo,
                      branch: form.branch,
                      year: form.year,
                    },
                  });
                  setMailbox({ email: res.email, code: res.mailboxCode, from: res.from });
                  setStep("code");
                  toast.success("Code fired at your Thapar mail.");
                } catch (err) {
                  toast.error(errMsg(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="Name" htmlFor="name">
                <Input id="name" value={form.name} onChange={set("name")} required />
              </Field>
              <Field label="Roll number" htmlFor="roll">
                <Input
                  id="roll"
                  value={form.rollNo}
                  onChange={set("rollNo")}
                  placeholder="102303123"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Branch" htmlFor="branch">
                  <select
                    id="branch"
                    className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
                    value={form.branch}
                    onChange={set("branch")}
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Year" htmlFor="year">
                  <select
                    id="year"
                    className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
                    value={form.year}
                    onChange={set("year")}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Thapar email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  placeholder="you@thapar.edu"
                  value={form.email}
                  onChange={set("email")}
                  required
                />
              </Field>
              <Field label="Password" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={8}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Slapping the inbox…" : "Send the damn code"}
              </Button>
            </form>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await verifySignupCode({
                    data: { email: form.email, code },
                  });
                  const { error } = await authClient.signUp.email({
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                    name: form.name.trim(),
                    callbackURL: "/board",
                  });
                  if (error) throw new Error(error.message ?? "Couldn't mint the account.");
                  await claimVerifiedProfile();
                  toast.success("You're in. Try not to waste the two credits.");
                  await navigate({ to: "/board" });
                } catch (err) {
                  toast.error(errMsg(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field label="Six-digit code" htmlFor="code">
                <Input
                  id="code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className="font-mono tracking-[0.4em]"
                  required
                />
              </Field>
              <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
                {busy ? "Minting you…" : "Verify and create account"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("form");
                  setMailbox(null);
                  setCode("");
                }}
              >
                Back to the form
              </Button>
            </form>
          )}

          <p className="mt-6 text-sm text-muted-foreground">
            Already rotting here?{" "}
            <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
        <div className="lg:pt-16">
          {mailbox ? (
            <Mailbox email={mailbox.email} code={mailbox.code} from={mailbox.from} />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              The verification mail will land here if campus SMTP is being typical TIET trash. Same
              six digits that went to @thapar.edu. Nobody else can use it. Admin can't be cloned
              from this form. Don't even try.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
