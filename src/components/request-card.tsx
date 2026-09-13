import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import type { ProxyCard } from "@/lib/proxy/types";

export function RequestCard({
  card,
  href,
  action,
}: {
  card: ProxyCard;
  href?: string;
  action?: React.ReactNode;
}) {
  const inner = (
    <article className="paper-chit relative overflow-hidden rounded-xl p-5 text-paper-ink shadow-[0_18px_40px_-28px_rgba(0,0,0,0.85)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] text-paper-ink/55 uppercase">
            Proxy chit · {card.courseCode}
          </p>
          <h3 className="font-display mt-1 text-xl leading-tight">{card.courseName}</h3>
        </div>
        <StatusBadge status={card.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-[11px] tracking-wide text-paper-ink/50 uppercase">When</dt>
          <dd>
            {formatDate(card.classDate)} · {card.slot}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-paper-ink/50 uppercase">Where</dt>
          <dd>{card.venue}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-paper-ink/50 uppercase">Faculty</dt>
          <dd>{card.faculty}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-paper-ink/50 uppercase">Posted by</dt>
          <dd>
            {card.requesterName} · {card.requesterRoll}
          </dd>
        </div>
      </dl>
      {card.note ? (
        <p className="mt-3 border-t border-paper-ink/10 pt-3 text-sm text-paper-ink/75">{card.note}</p>
      ) : null}
      {card.helperName ? (
        <p className="mt-3 text-xs text-paper-ink/60">
          Body in the chair: {card.helperName} ({card.helperRoll})
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </article>
  );

  if (!href) return inner;
  return (
    <Link to={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {inner}
    </Link>
  );
}
