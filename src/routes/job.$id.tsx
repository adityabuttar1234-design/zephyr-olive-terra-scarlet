import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, AuthGateSkeleton } from "@/components/app-shell";
import { ProofUploader } from "@/components/proof-uploader";
import { RequestCard } from "@/components/request-card";
import { Button } from "@/components/ui/button";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMe } from "@/components/use-me";
import { abandonJob, acceptRequest, getJob, uploadProof } from "@/lib/proxy/fns";
import type { ProxyCard } from "@/lib/proxy/types";
import { errMsg } from "@/lib/utils";

export const Route = createFileRoute("/job/$id")({ component: JobPage });

function JobPage() {
  const { id } = Route.useParams();
  const jobId = Number(id);
  const { user, isPending } = useCurrentUserState();
  const { profile, loading } = useMe();
  const [card, setCard] = useState<ProxyCard | null>(null);
  const [proof, setProof] = useState<{ imageData: string; caption: string; createdAt: string } | null>(
    null,
  );
  const [you, setYou] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await getJob({ data: { id: jobId } });
      setCard(res.card);
      setProof(res.proof);
      setYou(res.you);
      setLoadError(null);
    } catch (e) {
      setLoadError(errMsg(e));
    }
  }, [jobId]);

  useEffect(() => {
    if (!user || Number.isNaN(jobId)) return;
    void reload();
  }, [user, jobId, reload]);

  if (isPending || (user && loading && !profile)) return <AuthGateSkeleton />;
  if (!user) return <RedirectToSignIn />;
  if (!profile) return <AuthGateSkeleton />;

  const isHelper = you !== null && card?.helperId === you;
  const isRequester = you !== null && card?.requesterId === you;
  const canAccept = card?.status === "open" && !isRequester;
  const canUpload =
    isHelper && (card?.status === "accepted" || card?.status === "needs_proof");

  return (
    <AppShell profile={profile}>
      <Link to="/board" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to the board
      </Link>
      {loadError ? <p className="mt-6 text-sm text-stamp">{loadError}</p> : null}
      {!card && !loadError ? <div className="mt-6 h-48 animate-pulse rounded-xl bg-muted" /> : null}
      {card ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <RequestCard card={card} />
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-xl">What now?</h2>
            {card.status === "cancelled" ? (
              <p className="mt-2 text-sm text-muted-foreground">This chit is dead.</p>
            ) : null}
            {card.status === "completed" ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Buttar stamped it. Credit already moved. Go spend it on another bunk.
              </p>
            ) : null}
            {canAccept ? (
              <Button
                className="mt-4 w-full"
                onClick={async () => {
                  try {
                    await acceptRequest({ data: { id: card.id } });
                    toast.success("You're the body. Don't flake.");
                    await reload();
                  } catch (e) {
                    toast.error(errMsg(e));
                  }
                }}
              >
                I'll sit in
              </Button>
            ) : null}
            {isHelper && (card.status === "accepted" || card.status === "needs_proof") ? (
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={async () => {
                  try {
                    await abandonJob({ data: { id: card.id } });
                    toast.success("Dropped. Someone else can suffer.");
                    await reload();
                  } catch (e) {
                    toast.error(errMsg(e));
                  }
                }}
              >
                Drop this gig
              </Button>
            ) : null}
            {card.status === "needs_proof" && isHelper ? (
              <p className="mt-3 text-sm text-stamp">
                Bounced: {card.rejectReason ?? "Photo was trash."} Shoot again.
              </p>
            ) : null}
            {card.status === "pending_review" ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Sitting on Buttar's desk. Don't ping him. He will look when he looks.
              </p>
            ) : null}
            {canUpload ? (
              <div className="mt-4">
                <ProofUploader
                  onSubmit={async ({ imageData, caption }) => {
                    await uploadProof({ data: { id: card.id, imageData, caption } });
                    toast.success("Proof is in. Now we wait on the tyrant.");
                    await reload();
                  }}
                />
              </div>
            ) : null}
            {proof ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">On file</p>
                <img
                  src={proof.imageData}
                  alt="Proxy proof"
                  className="max-h-72 w-full rounded-lg object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
                />
                {proof.caption ? (
                  <p className="text-sm text-muted-foreground">{proof.caption}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
