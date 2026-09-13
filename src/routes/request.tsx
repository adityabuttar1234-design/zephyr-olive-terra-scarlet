import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, AuthGateSkeleton } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMe } from "@/components/use-me";
import { COURSES, SLOTS } from "@/lib/proxy/constants";
import { createRequest } from "@/lib/proxy/fns";
import { errMsg } from "@/lib/utils";

export const Route = createFileRoute("/request")({ component: RequestPage });

function todayYmd() {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function RequestPage() {
  const { user, isPending } = useCurrentUserState();
  const { profile, loading } = useMe();
  const navigate = useNavigate();
  const [courseCode, setCourseCode] = useState(COURSES[0]?.code ?? "UCS405");
  const [courseName, setCourseName] = useState(COURSES[0]?.name ?? "");
  const [customName, setCustomName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [faculty, setFaculty] = useState("");
  const [venue, setVenue] = useState("");
  const [classDate, setClassDate] = useState(todayYmd());
  const [slot, setSlot] = useState<string>(SLOTS[2] ?? SLOTS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const isCustom = courseCode === "CUSTOM";
  const resolvedCode = isCustom ? customCode.trim().toUpperCase() : courseCode;
  const resolvedName = isCustom ? customName.trim() : courseName;
  const minDate = useMemo(() => todayYmd(), []);

  if (isPending || (user && loading && !profile)) return <AuthGateSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <AuthGateSkeleton />;

  const broke = profile.credits < 1;

  return (
    <AppShell profile={profile}>
      <p className="font-mono text-[11px] tracking-[0.22em] text-stamp uppercase">New chit</p>
      <h1 className="font-display mt-1 text-3xl">Burn one credit. Skip the class.</h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        You have{" "}
        <span className="font-mono tabular-nums text-foreground">{profile.credits}</span> credits.
        Posting takes one. If it sits untouched you can kill it from My gigs and the credit slinks
        back.
      </p>

      {broke ? (
        <div className="mt-6 rounded-xl border border-stamp/40 bg-stamp/10 p-4 text-sm">
          You're broke. Sit in for someone else, get Buttar to stamp the photo, then come back
          and bunk like a professional.
        </div>
      ) : null}

      <form
        className="mt-8 max-w-xl space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const res = await createRequest({
              data: {
                courseCode: resolvedCode,
                courseName: resolvedName,
                faculty,
                venue,
                classDate,
                slot,
                note,
              },
            });
            toast.success(`Posted. ${res.credits} credit${res.credits === 1 ? "" : "s"} left.`);
            await navigate({ to: "/job/$id", params: { id: String(res.id) } });
          } catch (err) {
            toast.error(errMsg(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <select
            id="course"
            className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
            value={courseCode}
            onChange={(e) => {
              const code = e.target.value;
              setCourseCode(code);
              const hit = COURSES.find((c) => c.code === code);
              if (hit && hit.code !== "CUSTOM") setCourseName(hit.name);
            }}
          >
            {COURSES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code === "CUSTOM" ? c.name : `${c.code} — ${c.name}`}
              </option>
            ))}
          </select>
        </div>
        {isCustom ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cc">Code</Label>
              <Input
                id="cc"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="UCS999"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cn">Name</Label>
              <Input
                id="cn"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Whatever this elective is"
                required
              />
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="faculty">Faculty</Label>
          <Input
            id="faculty"
            value={faculty}
            onChange={(e) => setFaculty(e.target.value)}
            placeholder="Dr. Whoever is taking attendance today"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <Input
            id="venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="LT-201 / C-block"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              min={minDate}
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slot">Slot</Label>
            <select
              id="slot"
              className="h-11 w-full rounded-md border border-border bg-card px-3 text-sm"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note for the volunteer</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sit in the third row. Don't talk to the guy in yellow. He rats."
            maxLength={280}
          />
        </div>
        <Button type="submit" disabled={busy || broke}>
          {busy ? "Nailing it to the board…" : "Post · 1 credit"}
        </Button>
      </form>
    </AppShell>
  );
}
