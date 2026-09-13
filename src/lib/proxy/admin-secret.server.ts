import { createHmac, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

export const ADMIN_USERNAME = "123adminbuttar";
const ADMIN_PASSWORD = "2507buttarKS";
const COOKIE = "tiet_admin";
const SECRET = new TextEncoder().encode(
  "tiet-proxy-admin-lock-v1-123adminbuttar-2507buttarKS",
);

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    const dummy = createHmac("sha256", SECRET).update(a).digest();
    const other = createHmac("sha256", SECRET).update(b).digest();
    timingSafeEqual(dummy, other);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function credentialsMatch(username: string, password: string) {
  return safeEqual(username.trim(), ADMIN_USERNAME) && safeEqual(password, ADMIN_PASSWORD);
}

export async function mintAdminToken() {
  return new SignJWT({ role: "admin", sub: ADMIN_USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
}

export async function readAdminToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.role !== "admin" || payload.sub !== ADMIN_USERNAME) return null;
    return { user: ADMIN_USERNAME as const };
  } catch {
    return null;
  }
}

export async function setAdminCookie(token: string) {
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearAdminCookie() {
  deleteCookie(COOKIE, { path: "/" });
}

export async function requireAdmin(clientToken?: string | null) {
  const cookie = getCookie(COOKIE);
  const session = (await readAdminToken(clientToken)) ?? (await readAdminToken(cookie));
  if (!session) {
    const err = new Error("Wrong door, champ. Admin only.");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
  return session;
}
