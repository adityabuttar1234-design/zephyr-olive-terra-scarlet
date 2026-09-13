import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { getAdminToken } from "./admin-client";
import type { AdminQueueItem } from "./types";

export const adminMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    return next({ sendContext: { adminToken: getAdminToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("@/lib/auth/isolation.server");
    const { requireAdmin } = await import("./admin-secret.server");
    assertSameSiteRequest();
    await requireAdmin(context.adminToken);
    return next({ context: { admin: true as const } });
  });

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((d: { username: string; password: string }) => d)
  .handler(async ({ data }) => {
    const { credentialsMatch, mintAdminToken, setAdminCookie } = await import(
      "./admin-secret.server"
    );
    if (!credentialsMatch(data.username, data.password)) {
      throw new Error("Nope. That's not Buttar's lock.");
    }
    const token = await mintAdminToken();
    await setAdminCookie(token);
    return { ok: true as const, token };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAdminCookie } = await import("./admin-secret.server");
  clearAdminCookie();
  return { ok: true as const };
});

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([
    createMiddleware({ type: "function" })
      .client(async ({ next }) => next({ sendContext: { adminToken: getAdminToken() ?? undefined } }))
      .server(async ({ next, context }) => next({ context: { adminToken: context.adminToken as string | undefined } })),
  ])
  .handler(async ({ context }) => {
    const { readAdminToken } = await import("./admin-secret.server");
    const { getCookie } = await import("@tanstack/react-start/server");
    const cookie = getCookie("tiet_admin");
    const session = (await readAdminToken(context.adminToken)) ?? (await readAdminToken(cookie));
    return session ? { ok: true as const, user: session.user } : { ok: false as const };
  });

export const listAdminQueue = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const rows = await sql.query<{
      id: number;
      course_code: string;
      course_name: string;
      faculty: string;
      venue: string;
      class_date: string;
      slot: string;
      note: string;
      reject_reason: string | null;
      requester_name: string;
      requester_roll: string;
      helper_name: string;
      helper_roll: string;
      image_data: string;
      caption: string;
      proof_at: string;
    }>(
      `select r.id, r.course_code, r.course_name, r.faculty, r.venue, r.class_date, r.slot,
              r.note, r.reject_reason,
              req.name as requester_name, req.roll_no as requester_roll,
              h.name as helper_name, h.roll_no as helper_roll,
              coalesce((select image_data from proofs where request_id = r.id order by created_at desc limit 1), '') as image_data,
              coalesce((select caption from proofs where request_id = r.id order by created_at desc limit 1), '') as caption,
              coalesce((select created_at from proofs where request_id = r.id order by created_at desc limit 1), r.updated_at) as proof_at
       from proxy_requests r
       join profiles req on req.user_id = r.requester_id
       join profiles h on h.user_id = r.helper_id
       where r.status = 'pending_review'
       order by proof_at asc`,
    );
    return rows.map(
      (r): AdminQueueItem => ({
        id: r.id,
        courseCode: r.course_code,
        courseName: r.course_name,
        faculty: r.faculty,
        venue: r.venue,
        classDate: r.class_date,
        slot: r.slot,
        note: r.note,
        rejectReason: r.reject_reason,
        requesterName: r.requester_name,
        requesterRoll: r.requester_roll,
        helperName: r.helper_name,
        helperRoll: r.helper_roll,
        imageData: r.image_data,
        caption: r.caption,
        proofAt: String(r.proof_at),
      }),
    );
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const rows = await sql.query<{
      students: number;
      open: number;
      pending: number;
      completed: number;
    }>(
      `select
         (select count(*)::int from profiles) as students,
         (select count(*)::int from proxy_requests where status = 'open') as open,
         (select count(*)::int from proxy_requests where status = 'pending_review') as pending,
         (select count(*)::int from proxy_requests where status = 'completed') as completed`,
    );
    return rows[0] ?? { students: 0, open: 0, pending: 0, completed: 0 };
  });

export const approveProof = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<{ id: number; helper_id: string; course_code: string }>(
      `select id, helper_id, course_code from proxy_requests
       where id = $1 and status = 'pending_review' and helper_id is not null`,
      [data.id],
    );
    const row = rows[0];
    if (!row) throw new Error("Nothing to stamp. Already handled.");
    await sql.query(
      `update proxy_requests set status = 'completed', reject_reason = null, updated_at = now() where id = $1`,
      [row.id],
    );
    await sql.query(`update profiles set credits = credits + 1 where user_id = $1`, [row.helper_id]);
    await sql.query(
      `insert into credit_events (user_id, delta, reason, request_id) values ($1, 1, $2, $3)`,
      [row.helper_id, `Buttar stamped ${row.course_code}. Credit landed.`, row.id],
    );
    return { ok: true as const };
  });

export const rejectProof = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator((d: { id: number; reason: string }) => d)
  .handler(async ({ data }) => {
    const reason = data.reason.trim().slice(0, 200) || "Photo's trash. Try not to look like a hostage.";
    const sql = await getSql();
    const rows = await sql.query<{ id: number }>(
      `update proxy_requests
         set status = 'needs_proof', reject_reason = $2, updated_at = now()
       where id = $1 and status = 'pending_review'
       returning id`,
      [data.id, reason],
    );
    if (!rows[0]) throw new Error("Nothing to bounce.");
    return { ok: true as const };
  });
