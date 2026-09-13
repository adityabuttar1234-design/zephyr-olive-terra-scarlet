import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressProof } from "@/lib/proxy/image";
import { errMsg } from "@/lib/utils";

export function ProofUploader({
  onSubmit,
  busy,
}: {
  onSubmit: (payload: { imageData: string; caption: string }) => Promise<void>;
  busy?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!preview) {
          setError("Upload a photo. A selfie in the lecture hall, not your hostel pillow.");
          return;
        }
        setLocalBusy(true);
        onSubmit({ imageData: preview, caption })
          .catch((err) => setError(errMsg(err)))
          .finally(() => setLocalBusy(false));
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="proof">Proof photo</Label>
        <input
          id="proof"
          type="file"
          accept="image/*"
          capture="environment"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:h-11 file:rounded-md file:border-0 file:bg-primary file:px-4 file:text-sm file:font-medium file:text-primary-foreground"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError(null);
            try {
              setPreview(await compressProof(file));
            } catch (err) {
              setError(errMsg(err));
              setPreview(null);
            }
          }}
        />
      </div>
      {preview ? (
        <img
          src={preview}
          alt="Proof preview"
          className="max-h-64 w-full rounded-lg object-cover outline outline-1 -outline-offset-1 outline-foreground/10"
        />
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="caption">Caption (optional)</Label>
        <Textarea
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Row 4, third from the window. Faculty was late. As usual."
          maxLength={160}
        />
      </div>
      {error ? <p className="text-sm text-stamp">{error}</p> : null}
      <Button type="submit" disabled={busy || localBusy} className="w-full sm:w-auto">
        {busy || localBusy ? "Sending to Buttar…" : "Submit proof"}
      </Button>
    </form>
  );
}
