import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/proxy/constants";
import type { RequestStatus } from "@/lib/proxy/types";

const TONE: Record<RequestStatus, "muted" | "stamp" | "good" | "warn" | "paper"> = {
  open: "paper",
  accepted: "warn",
  pending_review: "stamp",
  needs_proof: "stamp",
  completed: "good",
  cancelled: "muted",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={TONE[status]}>{STATUS_LABEL[status] ?? status}</Badge>;
}
