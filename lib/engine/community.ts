// Community rules (I01–I03, I15). Pure: used by the API to validate and by the UI to label.
export const POST_TYPES = [
  { key: "update", label: "Update", hint: "Share what's happening" },
  { key: "win", label: "Win", hint: "Celebrate something good" },
  { key: "struggle", label: "Struggle", hint: "Share something hard, and get support" },
  { key: "question", label: "Question", hint: "Ask people who've been there" },
] as const;
export type PostType = (typeof POST_TYPES)[number]["key"] | "milestone";

export const REPORT_REASONS = [
  { key: "spam", label: "Spam or selling" },
  { key: "harassment", label: "Harassment or bullying" },
  { key: "scam", label: "Scam or fraud" },
  { key: "private_info", label: "Shares private information" },
  { key: "inappropriate", label: "Inappropriate content" },
  { key: "other", label: "Something else" },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]["key"];

export const REACTIONS = [
  { key: "cheer", label: "Cheer", emoji: "👏" },
  { key: "relate", label: "Relate", emoji: "🤝" },
  { key: "insight", label: "Helpful", emoji: "💡" },
] as const;
export type ReactionKind = (typeof REACTIONS)[number]["key"];

export const MAX_POST = 2000, MAX_COMMENT = 1000, MAX_PHOTOS = 3;

export type PostInput = { type?: unknown; body?: unknown; anonymous?: unknown; audience?: unknown; media_urls?: unknown };
export type PostValid = { type: PostType; body: string; anonymous: boolean; audience: "public"; media_urls: string[] };

/** Only public posts exist in Phase 1; connections and circles arrive with those features (Phase 2). */
export function validatePost(i: PostInput): { ok: true; value: PostValid } | { ok: false; error: string } {
  const type = POST_TYPES.find((t) => t.key === i.type)?.key;
  if (!type) return { ok: false, error: "Pick what kind of post this is." };
  const body = typeof i.body === "string" ? i.body.trim().replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n") : "";
  if (!body) return { ok: false, error: "Write a few words first." };
  if (body.length > MAX_POST) return { ok: false, error: `Keep it under ${MAX_POST} characters.` };
  if (i.audience !== undefined && i.audience !== "public") return { ok: false, error: "Only public posts are available for now." };
  const media = Array.isArray(i.media_urls) ? i.media_urls : [];
  if (media.length > MAX_PHOTOS) return { ok: false, error: `You can add up to ${MAX_PHOTOS} photos.` };
  if (media.some((u) => typeof u !== "string" || !/^https:\/\//.test(u) || u.length > 500)) return { ok: false, error: "One of the photos isn't valid." };
  return { ok: true, value: { type, body, anonymous: i.anonymous === true, audience: "public", media_urls: media as string[] } };
}

export const validateComment = (body: unknown): { ok: true; body: string } | { ok: false; error: string } => {
  const b = typeof body === "string" ? body.trim() : "";
  if (!b) return { ok: false, error: "Write a few words first." };
  if (b.length > MAX_COMMENT) return { ok: false, error: `Keep it under ${MAX_COMMENT} characters.` };
  return { ok: true, body: b };
};

/** "now", "5m", "3h", "2d", then "4 Oct". */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}
