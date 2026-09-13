import { APP_NAME } from "@/lib/proxy/constants";

export function Mailbox({ email, code, from }: { email: string; code: string; from: string }) {
  const digits = code.split("");
  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          Thapar webmail intercept
        </p>
        <p className="text-[10px] text-muted-foreground">UNREAD</p>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-xs text-muted-foreground">
          From <span className="text-foreground">{from}</span>
          <br />
          To <span className="text-foreground">{email}</span>
        </p>
        <p className="font-display text-lg">Your damn verification code</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Stop losing your Thapar mail password. {APP_NAME} slapped this on your inbox because you
          asked to join the racket. Six digits. Ten minutes. Don't forward it to the whole wing,
          you absolute walnut.
        </p>
        <div className="flex justify-center gap-1.5 py-2">
          {digits.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="grid size-11 place-items-center rounded-md bg-paper font-mono text-xl font-medium text-paper-ink"
            >
              {d}
            </span>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Campus SMTP is a dumpster fire, so the intercept is parked here too. Same code that went
          to @{email.split("@")[1]}.
        </p>
      </div>
    </aside>
  );
}
