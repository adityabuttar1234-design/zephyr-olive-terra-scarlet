import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "muted",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "stamp" | "good" | "warn" | "paper";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "stamp" && "bg-stamp/15 text-stamp",
        tone === "good" && "bg-good/15 text-good",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "paper" && "bg-paper text-paper-ink",
        className,
      )}
      {...props}
    />
  );
}
