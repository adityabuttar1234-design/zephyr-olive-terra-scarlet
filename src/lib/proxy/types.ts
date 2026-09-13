export type RequestStatus =
  | "open"
  | "accepted"
  | "pending_review"
  | "needs_proof"
  | "completed"
  | "cancelled";

export type Profile = {
  userId: string;
  email: string;
  name: string;
  rollNo: string;
  branch: string;
  year: string;
  credits: number;
};

export type ProxyCard = {
  id: number;
  requesterId: string;
  helperId: string | null;
  courseCode: string;
  courseName: string;
  faculty: string;
  venue: string;
  classDate: string;
  slot: string;
  note: string;
  status: RequestStatus;
  rejectReason: string | null;
  createdAt: string;
  requesterName: string;
  requesterRoll: string;
  requesterBranch: string;
  requesterYear: string;
  helperName: string | null;
  helperRoll: string | null;
};

export type CreditEvent = {
  id: number;
  delta: number;
  reason: string;
  requestId: number | null;
  createdAt: string;
};

export type AdminQueueItem = {
  id: number;
  courseCode: string;
  courseName: string;
  faculty: string;
  venue: string;
  classDate: string;
  slot: string;
  note: string;
  rejectReason: string | null;
  requesterName: string;
  requesterRoll: string;
  helperName: string;
  helperRoll: string;
  imageData: string;
  caption: string;
  proofAt: string;
};
