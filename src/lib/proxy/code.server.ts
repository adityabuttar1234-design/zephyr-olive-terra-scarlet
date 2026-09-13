import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export function hashCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email.toLowerCase().trim()}:${code}`)
    .digest("hex");
}

export function hashesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function generateCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
