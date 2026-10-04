/**
 * Claude client + small helpers. Server-only: the API key never reaches the browser.
 * Model names come from env (spec §9.1): SPAL_MODEL_MAIN for conversation/vision,
 * SPAL_MODEL_FAST for classification and short extraction.
 */
import Anthropic from "@anthropic-ai/sdk";

export const MODEL_MAIN = () => process.env.SPAL_MODEL_MAIN || "claude-sonnet-5-5";
export const MODEL_FAST = () => process.env.SPAL_MODEL_FAST || "claude-haiku-4-5";

let _client: Anthropic | null = null;
/** Lazy so `next build` works without a key. */
export function claude(): Anthropic {
  return (_client ??= new Anthropic());
}

type Effort = "low" | "medium" | "high";

type CallOpts = {
  model?: string;
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  /** Ignored on Haiku, which does not support effort. */
  effort?: Effort;
};

export type Usage = { input: number; output: number };

/** Plain text completion that also reports token usage (for the daily budget). */
export async function askTextFull(opts: CallOpts): Promise<{ text: string; usage: Usage; refused: boolean }> {
  const model = opts.model ?? MODEL_MAIN();
  const res = await claude().messages.create({
    model,
    max_tokens: opts.maxTokens ?? 2000,
    ...(opts.system ? { system: opts.system } : {}),
    ...(model.includes("haiku") ? {} : { output_config: { effort: opts.effort ?? "low" } }),
    messages: opts.messages,
  });
  const text = res.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("")
    .trim();
  const refused = res.stop_reason === "refusal";
  return { text: refused ? "" : text, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens }, refused };
}

/** Plain text completion. Returns concatenated text blocks. */
export async function askText(opts: CallOpts): Promise<string> {
  return (await askTextFull(opts)).text;
}

/** Extract the first JSON object from model text (tolerates ``` fences and chatter). */
export function extractJSON<T = Record<string, unknown>>(text: string): T {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return {} as T;
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    return {} as T;
  }
}

/** Ask for a JSON object. The system prompt must describe the shape. */
export async function askJSON<T = Record<string, unknown>>(opts: CallOpts): Promise<T> {
  const system = `${opts.system ?? ""}\n\nReturn ONLY one valid JSON object. No prose, no markdown fences.`.trim();
  return extractJSON<T>(await askText({ ...opts, system }));
}

type ImageMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const MEDIA: ImageMedia[] = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** Image content block from raw base64, a data: URL, or an https URL. */
export function imageBlock(src: { base64: string; mimeType: string } | { url: string }): Anthropic.ImageBlockParam {
  if ("url" in src) {
    const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(src.url);
    if (!m) return { type: "image", source: { type: "url", url: src.url } };
    return imageBlock({ base64: m[2], mimeType: m[1] });
  }
  const media = (MEDIA as string[]).includes(src.mimeType) ? (src.mimeType as ImageMedia) : "image/jpeg";
  return { type: "image", source: { type: "base64", media_type: media, data: src.base64 } };
}
