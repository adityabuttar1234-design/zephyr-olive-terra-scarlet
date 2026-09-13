import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import {
  BRANCHES,
  COURSES,
  EMAIL_DOMAIN,
  isReservedIdentity,
  isThaparEmail,
  SLOTS,
  STARTER_CREDITS,
  YEARS,
} from "./constants";
import type { CreditEvent, Profile, ProxyCard, RequestStatus } from "./types";

type UserRow = { id: string; name: string; email: string };
type ProfileRow = {
  user_id: string;
  email: string;
  name: string;
  roll_no: string;
  branch: string;
  year: string;
  credits: number;
};
type RequestRow = {
  id: number;
  requester_id: string;
  helper_id: string | null;
  course_code: string;
  course_name: string;
  faculty: string;
  venue: string;
  class_date: string;
  slot: string;
  note: string;
  status: RequestStatus;
  reject_reason: string | null;
  created_at: string;
  requester_name: string;
  requester_roll: string;
  requester_branch: string;
  requester_year: string;
  helper_name: string | null;
  helper_roll: string | null;
};

function fail(message: string): never {
  throw new Error(message);
}

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    email: row.email,
    name: row.name,
    rollNo: row.roll_no,
    branch: row.branch,
    year: row.year,
    credits: row.credits,
  };
}

function toCard(row: RequestRow): ProxyCard {
  return {
    id: row.id,
    requesterId: row.requester_id,
    helperId: row.helper_id,
    courseCode: row.course_code,
    courseName: row.course_name,
    faculty: row.faculty,
    venue: row.venue,
    classDate: row.class_date,
    slot: row.slot,
    note: row.note,
    status: row.status,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
    requesterName: row.requester_name,
    requesterRoll: row.requester_roll,
    requesterBranch: row.requester_branch,
    requesterYear: row.requester_year,
    helperName: row.helper_name,
    helperRoll: row.helper_roll,
  };
}

const CARD_SELECT = `
  r.id, r.requester_id, r.helper_id, r.course_code, r.course_name, r.faculty,
  r.venue, r.class_date, r.slot, r.note, r.status, r.reject_reason, r.created_at,
  req.name as requester_name, req.roll_no as requester_roll,
  req.branch as requester_branch, req.year as requester_year,
  h.name as helper_name, h.roll_no as helper_roll
`;

async function authUser(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql.query<UserRow>(
    `select id, name, email from "user" where id = $1`,
    [userId],
  );
  const user = rows[0];
  if (!user) fail("Session is a ghost. Sign in again.");
  return user;
}

async function loadProfile(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql.query<ProfileRow>(
    `select user_id, email, name, roll_no, branch, year, credits from profiles where user_id = $1`,
    [userId],
  );
  return rows[0] ? toProfile(rows[0]) : null;
}

async function writeCredit(
  sql: Awaited<ReturnType<typeof getSql>>,
  userId: string,
  delta: number,
  reason: string,
  requestId: number | null,
) {
  await sql.query(
    `insert into credit_events (user_id, delta, reason, request_id) values ($1, $2, $3, $4)`,
    [userId, delta, reason, requestId],
  );
}

function cleanName(name: string) {
  const v = name.trim().replace(/\s+/g, " ");
  if (v.length < 2 || v.length > 60) fail("Name's a mess. 2–60 characters.");
  if (isReservedIdentity(v)) fail("That name is nailed to the admin chair.");
  return v;
}

function cleanRoll(roll: string) {
  const v = roll.trim().toUpperCase();
  if (!/^[A-Z0-9\-\/]{6,20}$/.test(v)) fail("Roll number looks fake. Use your actual one.");
  if (isReservedIdentity(v)) fail("Cute. That's not a roll number.");
  return v;
}

function cleanBranch(branch: string) {
  const v = branch.trim().toUpperCase();
  if (!(BRANCHES as readonly string[]).includes(v)) fail("Pick a real branch, not a fever dream.");
  return v;
}

function cleanYear(year: string) {
  const v = year.trim();
  if (!(YEARS as readonly string[]).includes(v)) fail("Year has to be 1st–4th.");
  return v;
}

function cleanEmail(email: string) {
  const v = email.trim().toLowerCase();
  if (!isThaparEmail(v)) fail(`Only @${EMAIL_DOMAIN} mail. Gmail kids can wait outside.`);
  if (isReservedIdentity(v)) fail("That throne is taken. Admin account is locked, forever.");
  return v;
}

function ymdOffset(days: number) {
  const t = new Date();
  t.setDate(t.getDate() + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

async function ensureSeed(sql: Awaited<ReturnType<typeof getSql>>) {
  const rows = await sql.query<{ n: number }>(`select count(*)::int as n from proxy_requests`);
  if ((rows[0]?.n ?? 0) > 0) return;
  await sql.query(
    `insert into profiles (user_id, email, name, roll_no, branch, year, credits)
     values
       ('seed-kavya', 'kavya.brar@thapar.edu', 'Kavya Brar', '102303001', 'COE', '3rd', 1),
       ('seed-arjun', 'arjun.mann@thapar.edu', 'Arjun Mann', '102303045', 'CSE', '2nd', 2),
       ('seed-mehar', 'mehar.gill@thapar.edu', 'Mehar Gill', '102204112', 'ECE', '4th', 0)
     on conflict (user_id) do nothing`,
  );
  const d1 = ymdOffset(1);
  const d2 = ymdOffset(2);
  await sql.query(
    `insert into proxy_requests
       (requester_id, course_code, course_name, faculty, venue, class_date, slot, note, status)
     values
       ('seed-kavya', 'UCS405', 'Operating Systems', 'Dr. Sharma', 'LT-201', $1, '09:00 – 10:00',
        'Third row. Don''t sit next to the yellow-hoodie rat. He snitches.', 'open'),
       ('seed-arjun', 'UCS414', 'Computer Networks', 'Prof. Kaur', 'C-Block 3', $1, '11:00 – 12:00',
        'Click my name. Don''t ask questions. Don''t be a hero.', 'open'),
       ('seed-mehar', 'UHU005', 'Humanities for Engineers', 'Dr. Bansal', 'LP-101', $2, '14:00 – 15:00',
        'I have a mid-sem. Sit in, look vaguely sentient, collect the photo.', 'open')`,
    [d1, d2],
  );
}

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  await ensureSeed(sql);
  const rows = await sql.query<{ students: number; open: number; completed: number }>(
    `select
       (select count(*)::int from profiles) as students,
       (select count(*)::int from proxy_requests where status = 'open') as open,
       (select count(*)::int from proxy_requests where status = 'completed') as completed`,
  );
  return rows[0] ?? { students: 0, open: 0, completed: 0 };
});

export const requestSignupCode = createServerFn({ method: "POST" })
  .validator((d: { email: string; name: string; rollNo: string; branch: string; year: string }) => d)
  .handler(async ({ data }) => {
    const email = cleanEmail(data.email);
    const name = cleanName(data.name);
    const rollNo = cleanRoll(data.rollNo);
    const branch = cleanBranch(data.branch);
    const year = cleanYear(data.year);

    const sql = await getSql();
    const existing = await sql.query<{ n: number }>(
      `select count(*)::int as n from profiles where email = $1 or roll_no = $2`,
      [email, rollNo],
    );
    if ((existing[0]?.n ?? 0) > 0) {
      fail("That mail or roll is already in the racket. Log in.");
    }

    const prior = await sql.query<{ sent_count: number; last_sent_at: string }>(
      `select sent_count, last_sent_at from pending_signups where email = $1`,
      [email],
    );
    const last = prior[0];
    if (last) {
      const ago = Date.now() - new Date(last.last_sent_at).getTime();
      if (ago < 45_000) fail("Slow down. Campus mail isn't that fast.");
      if (last.sent_count >= 8) fail("That's enough codes. Try again later, you impatient gremlin.");
    }

    const { generateCode, hashCode } = await import("./code.server");
    const code = generateCode();
    const codeHash = hashCode(email, code);
    await sql.query(
      `insert into pending_signups
         (email, name, roll_no, branch, year, code_hash, sent_count, last_sent_at, verified_at, expires_at)
       values ($1, $2, $3, $4, $5, $6, 1, now(), null, now() + interval '10 minutes')
       on conflict (email) do update set
         name = excluded.name,
         roll_no = excluded.roll_no,
         branch = excluded.branch,
         year = excluded.year,
         code_hash = excluded.code_hash,
         sent_count = pending_signups.sent_count + 1,
         last_sent_at = now(),
         verified_at = null,
         expires_at = now() + interval '10 minutes'`,
      [email, name, rollNo, branch, year, codeHash],
    );

    return {
      ok: true as const,
      email,
      mailboxCode: code,
      from: `TIET Proxy <noreply@${EMAIL_DOMAIN}>`,
    };
  });

export const verifySignupCode = createServerFn({ method: "POST" })
  .validator((d: { email: string; code: string }) => d)
  .handler(async ({ data }) => {
    const email = cleanEmail(data.email);
    const code = data.code.trim();
    if (!/^\d{6}$/.test(code)) fail("Six digits. Not poetry.");

    const sql = await getSql();
    const { hashCode, hashesMatch } = await import("./code.server");
    const rows = await sql.query<{ code_hash: string; expires_at: string; verified_at: string | null }>(
      `select code_hash, expires_at, verified_at from pending_signups where email = $1`,
      [email],
    );
    const row = rows[0];
    if (!row) fail("No code on file. Request one first.");
    if (new Date(row.expires_at).getTime() < Date.now()) fail("Code expired. Ask for another, quicker this time.");
    if (!hashesMatch(row.code_hash, hashCode(email, code))) fail("Wrong code. Check the mail, don't guess.");

    await sql.query(
      `update pending_signups
         set verified_at = now(), expires_at = now() + interval '30 minutes'
       where email = $1`,
      [email],
    );
    return { ok: true as const, email };
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureSeed(sql);
    let profile = await loadProfile(sql, context.userId);
    if (profile) return profile;

    const user = await authUser(sql, context.userId);
    const email = user.email.toLowerCase();
    if (!isThaparEmail(email) || isReservedIdentity(email)) return null;

    const pending = await sql.query<
      Pick<ProfileRow, "email" | "name" | "roll_no" | "branch" | "year"> & { verified_at: string | null }
    >(
      `select email, name, roll_no, branch, year, verified_at
       from pending_signups where email = $1`,
      [email],
    );
    const p = pending[0];
    if (!p?.verified_at) return null;

    const taken = await sql.query<{ n: number }>(
      `select count(*)::int as n from profiles where roll_no = $1 or email = $2`,
      [p.roll_no, p.email],
    );
    if ((taken[0]?.n ?? 0) > 0) return null;

    await sql.query(
      `insert into profiles (user_id, email, name, roll_no, branch, year, credits)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (user_id) do nothing`,
      [context.userId, p.email, p.name, p.roll_no, p.branch, p.year, STARTER_CREDITS],
    );
    const created = await loadProfile(sql, context.userId);
    if (created) {
      const ev = await sql.query<{ n: number }>(
        `select count(*)::int as n from credit_events where user_id = $1`,
        [context.userId],
      );
      if ((ev[0]?.n ?? 0) === 0) {
        await writeCredit(
          sql,
          context.userId,
          STARTER_CREDITS,
          "Welcome stash. Two bunks. Don't waste them like your JEE rank.",
          null,
        );
      }
      await sql.query(`delete from pending_signups where email = $1`, [p.email]);
    }
    return created;
  });

export const claimVerifiedProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { email: string; code: string }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await loadProfile(sql, context.userId);
    if (existing) return existing;

    const email = cleanEmail(data.email);
    const code = data.code.trim();
    if (!/^\d{6}$/.test(code)) fail("Six digits. Not poetry.");

    const { hashCode, hashesMatch } = await import("./code.server");
    const pending = await sql.query<{
      name: string;
      roll_no: string;
      branch: string;
      year: string;
      code_hash: string;
      expires_at: string;
    }>(
      `select name, roll_no, branch, year, code_hash, expires_at
       from pending_signups where email = $1`,
      [email],
    );
    const p = pending[0];
    if (!p) fail("No code on file. Request one first.");
    if (new Date(p.expires_at).getTime() < Date.now()) fail("Code expired. Ask for another.");
    if (!hashesMatch(p.code_hash, hashCode(email, code))) fail("Wrong code. Check the mail.");

    const clash = await sql.query<{ n: number }>(
      `select count(*)::int as n from profiles where roll_no = $1 or email = $2`,
      [p.roll_no, email],
    );
    if ((clash[0]?.n ?? 0) > 0) fail("That mail or roll already eats here.");

    await sql.query(
      `insert into profiles (user_id, email, name, roll_no, branch, year, credits)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [context.userId, email, p.name, p.roll_no, p.branch, p.year, STARTER_CREDITS],
    );
    await writeCredit(
      sql,
      context.userId,
      STARTER_CREDITS,
      "Welcome stash. Two bunks. Don't waste them like your JEE rank.",
      null,
    );
    await sql.query(`delete from pending_signups where email = $1`, [email]);
    const profile = await loadProfile(sql, context.userId);
    if (!profile) fail("Profile vanished mid-write.");
    return profile;
  });

export const listBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureSeed(sql);
    const rows = await sql.query<RequestRow>(
      `select ${CARD_SELECT}
       from proxy_requests r
       join profiles req on req.user_id = r.requester_id
       left join profiles h on h.user_id = r.helper_id
       where r.status = 'open' and r.requester_id <> $1
       order by r.class_date asc, r.created_at desc`,
      [context.userId],
    );
    return rows.map(toCard);
  });

export const listMine = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<RequestRow>(
      `select ${CARD_SELECT}
       from proxy_requests r
       join profiles req on req.user_id = r.requester_id
       left join profiles h on h.user_id = r.helper_id
       where r.requester_id = $1 or r.helper_id = $1
       order by r.created_at desc`,
      [context.userId],
    );
    return rows.map(toCard);
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql.query<RequestRow>(
      `select ${CARD_SELECT}
       from proxy_requests r
       join profiles req on req.user_id = r.requester_id
       left join profiles h on h.user_id = r.helper_id
       where r.id = $1`,
      [data.id],
    );
    const card = rows[0] ? toCard(rows[0]) : null;
    if (!card) fail("That chit doesn't exist.");
    const involved = card.requesterId === context.userId || card.helperId === context.userId;
    let proof: { imageData: string; caption: string; createdAt: string } | null = null;
    if (involved && (card.status === "pending_review" || card.status === "completed" || card.status === "needs_proof")) {
      const p = await sql.query<{ image_data: string; caption: string; created_at: string }>(
        `select image_data, caption, created_at from proofs
         where request_id = $1 order by created_at desc limit 1`,
        [card.id],
      );
      if (p[0]) {
        proof = { imageData: p[0].image_data, caption: p[0].caption, createdAt: p[0].created_at };
      }
    }
    return { card, proof, you: context.userId };
  });

export const createRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (d: {
      courseCode: string;
      courseName: string;
      faculty: string;
      venue: string;
      classDate: string;
      slot: string;
      note: string;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) fail("Finish joining the racket first.");

    const courseCode = data.courseCode.trim().toUpperCase();
    const courseName = data.courseName.trim();
    const faculty = data.faculty.trim();
    const venue = data.venue.trim();
    const classDate = data.classDate.trim();
    const slot = data.slot.trim();
    const note = data.note.trim().slice(0, 280);
    if (!/^[A-Z]{2,4}[0-9]{2,4}$/.test(courseCode) && courseCode !== "CUSTOM") {
      const known = COURSES.some((c) => c.code === courseCode);
      if (!known) fail("Course code looks invented.");
    }
    if (courseName.length < 2) fail("Name the damn course.");
    if (faculty.length < 2) fail("Faculty name. Even a nickname.");
    if (venue.length < 2) fail("Where is the class, a forest?");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(classDate)) fail("Pick a real date.");
    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (classDate < ymd) fail("That class already happened, time-traveller.");
    if (!(SLOTS as readonly string[]).includes(slot)) fail("Pick a slot from the list.");

    const dup = await sql.query<{ n: number }>(
      `select count(*)::int as n from proxy_requests
       where requester_id = $1 and course_code = $2 and class_date = $3 and slot = $4
         and status in ('open','accepted','pending_review','needs_proof')`,
      [context.userId, courseCode, classDate, slot],
    );
    if ((dup[0]?.n ?? 0) > 0) fail("You already have that class on the board.");

    const debit = await sql.query<{ credits: number }>(
      `update profiles set credits = credits - 1
       where user_id = $1 and credits >= 1
       returning credits`,
      [context.userId],
    );
    if (!debit[0]) fail("You're broke, champ. Sit in for someone else and earn a credit.");

    const inserted = await sql.query<{ id: number }>(
      `insert into proxy_requests
         (requester_id, course_code, course_name, faculty, venue, class_date, slot, note, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
       returning id`,
      [context.userId, courseCode, courseName, faculty, venue, classDate, slot, note],
    );
    const id = inserted[0]?.id;
    if (!id) fail("Request fell into a drain.");
    await writeCredit(sql, context.userId, -1, `Posted proxy for ${courseCode}`, id);
    return { id, credits: debit[0].credits };
  });

export const cancelRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql.query<{ id: number; status: string }>(
      `select id, status from proxy_requests where id = $1 and requester_id = $2`,
      [data.id, context.userId],
    );
    const row = rows[0];
    if (!row) fail("Not your chit.");
    if (row.status !== "open") fail("Too late. Someone already picked it up.");
    await sql.query(
      `update proxy_requests set status = 'cancelled', updated_at = now() where id = $1`,
      [data.id],
    );
    const refund = await sql.query<{ credits: number }>(
      `update profiles set credits = credits + 1 where user_id = $1 returning credits`,
      [context.userId],
    );
    await writeCredit(sql, context.userId, 1, "Refund — cancelled an open request", data.id);
    return { credits: refund[0]?.credits ?? 0 };
  });

export const acceptRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await loadProfile(sql, context.userId);
    if (!me) fail("Join the racket first.");
    const grabbed = await sql.query<{ id: number }>(
      `update proxy_requests
         set helper_id = $1, status = 'accepted', updated_at = now()
       where id = $2 and status = 'open' and requester_id <> $1
       returning id`,
      [context.userId, data.id],
    );
    if (!grabbed[0]) fail("Gone. Someone faster — or that's your own class, narcissist.");
    return { ok: true as const };
  });

export const abandonJob = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const dropped = await sql.query<{ id: number }>(
      `update proxy_requests
         set helper_id = null, status = 'open', reject_reason = null, updated_at = now()
       where id = $1 and helper_id = $2 and status in ('accepted','needs_proof')
       returning id`,
      [data.id, context.userId],
    );
    if (!dropped[0]) fail("Can't drop this one.");
    return { ok: true as const };
  });

export const uploadProof = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { id: number; imageData: string; caption: string }) => d)
  .handler(async ({ context, data }) => {
    if (!data.imageData.startsWith("data:image/jpeg") && !data.imageData.startsWith("data:image/png")) {
      fail("JPEG or PNG. Not a PDF of your feelings.");
    }
    if (data.imageData.length > 900_000) fail("Photo's too heavy. Compress it.");
    const caption = data.caption.trim().slice(0, 160);
    const sql = await getSql();
    const rows = await sql.query<{ id: number; status: string }>(
      `select id, status from proxy_requests
       where id = $1 and helper_id = $2 and status in ('accepted','needs_proof')`,
      [data.id, context.userId],
    );
    if (!rows[0]) fail("This isn't your gig, or it's in the wrong state.");
    await sql.query(
      `insert into proofs (request_id, helper_id, image_data, caption) values ($1, $2, $3, $4)`,
      [data.id, context.userId, data.imageData, caption],
    );
    await sql.query(
      `update proxy_requests
         set status = 'pending_review', reject_reason = null, updated_at = now()
       where id = $1`,
      [data.id],
    );
    return { ok: true as const };
  });

export const listCredits = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql.query<{
      id: number;
      delta: number;
      reason: string;
      request_id: number | null;
      created_at: string;
    }>(
      `select id, delta, reason, request_id, created_at
       from credit_events where user_id = $1
       order by created_at desc limit 40`,
      [context.userId],
    );
    return rows.map(
      (r): CreditEvent => ({
        id: r.id,
        delta: r.delta,
        reason: r.reason,
        requestId: r.request_id,
        createdAt: r.created_at,
      }),
    );
  });
