export const APP_NAME = "TIET Proxy";
export const APP_MARK = "Patiala bunk bazaar";
export const CAMPUS = "Thapar Institute of Engineering & Technology";
export const EMAIL_DOMAIN = "thapar.edu";
export const STARTER_CREDITS = 2;
export const CODE_TTL_MINUTES = 10;

export const BRANCHES = [
  "COE",
  "CSE",
  "ECE",
  "ENC",
  "MEC",
  "CIE",
  "CHE",
  "ELE",
  "BIO",
  "MEE",
  "CIV",
  "EIC",
] as const;

export const YEARS = ["1st", "2nd", "3rd", "4th"] as const;

export const SLOTS = [
  "08:00 – 09:00",
  "09:00 – 10:00",
  "10:00 – 11:00",
  "11:00 – 12:00",
  "12:00 – 13:00",
  "13:00 – 14:00",
  "14:00 – 15:00",
  "15:00 – 16:00",
  "16:00 – 17:00",
  "17:00 – 18:00",
] as const;

export const COURSES: { code: string; name: string }[] = [
  { code: "UCS405", name: "Operating Systems" },
  { code: "UCS414", name: "Computer Networks" },
  { code: "UCS310", name: "Database Management Systems" },
  { code: "UCS415", name: "Data Structures" },
  { code: "UCS617", name: "Artificial Intelligence" },
  { code: "UCS503", name: "Software Engineering" },
  { code: "UCS701", name: "Theory of Computation" },
  { code: "UMA035", name: "Numerical Analysis" },
  { code: "UTA024", name: "Engineering Design Project" },
  { code: "UES013", name: "Electrical Engineering" },
  { code: "UPH013", name: "Physics" },
  { code: "UHU005", name: "Humanities for Engineers" },
  { code: "UEE001", name: "Circuit Theory" },
  { code: "UCS406", name: "Computer Architecture" },
  { code: "CUSTOM", name: "Other / write-in" },
];

export const STATUS_LABEL: Record<string, string> = {
  open: "On the board",
  accepted: "Body assigned",
  pending_review: "Waiting on Buttar",
  needs_proof: "Proof bounced",
  completed: "Cashed in",
  cancelled: "Killed",
};

export function isThaparEmail(email: string) {
  return /^[a-z0-9._%+\-]+@thapar\.edu$/i.test(email.trim());
}

export function isReservedIdentity(value: string) {
  const v = value.trim().toLowerCase();
  const local = v.split("@")[0] ?? v;
  return (
    local === "123adminbuttar" ||
    local === "adminbuttar" ||
    local === "admin" ||
    v === "123adminbuttar" ||
    v.includes("123adminbuttar")
  );
}
