import { describe, it, expect } from "vitest";
import { timeAgo, validateComment, validatePost } from "./community";

describe("validatePost", () => {
  const ok = { type: "win", body: "Registered my business today!" };
  it("accepts a normal post and defaults to public, named", () => {
    const r = validatePost(ok);
    expect(r).toEqual({ ok: true, value: { type: "win", body: "Registered my business today!", anonymous: false, audience: "public", media_urls: [] } });
  });
  it("needs a known type and some words", () => {
    expect(validatePost({ ...ok, type: "advert" }).ok).toBe(false);
    expect(validatePost({ ...ok, body: "   " }).ok).toBe(false);
    expect(validatePost({ ...ok, body: "x".repeat(2001) }).ok).toBe(false);
  });
  it("members cannot post as a 'milestone' card by hand", () => expect(validatePost({ ...ok, type: "milestone" }).ok).toBe(false));
  it("only public audience for now", () => {
    expect(validatePost({ ...ok, audience: "connections" }).ok).toBe(false);
    expect(validatePost({ ...ok, audience: "public" }).ok).toBe(true);
  });
  it("anonymous is only ever an explicit true", () => {
    expect(validatePost({ ...ok, anonymous: "true" } as never).ok && (validatePost({ ...ok, anonymous: "true" } as never) as { value: { anonymous: boolean } }).value.anonymous).toBe(false);
    expect((validatePost({ ...ok, anonymous: true }) as { value: { anonymous: boolean } }).value.anonymous).toBe(true);
  });
  it("limits and checks photos", () => {
    expect(validatePost({ ...ok, media_urls: ["https://a/1", "https://a/2", "https://a/3", "https://a/4"] }).ok).toBe(false);
    expect(validatePost({ ...ok, media_urls: ["http://insecure/1"] }).ok).toBe(false);
    expect(validatePost({ ...ok, media_urls: ["javascript:alert(1)"] }).ok).toBe(false);
    expect(validatePost({ ...ok, media_urls: ["https://cdn/x.jpg"] }).ok).toBe(true);
  });
  it("tidies blank lines", () => {
    expect((validatePost({ ...ok, body: "a\n\n\n\nb  \nc" }) as { value: { body: string } }).value.body).toBe("a\n\nb\nc");
  });
});

describe("validateComment / timeAgo", () => {
  it("validates comments", () => {
    expect(validateComment("  Congrats!  ")).toEqual({ ok: true, body: "Congrats!" });
    expect(validateComment("").ok).toBe(false);
    expect(validateComment("x".repeat(1001)).ok).toBe(false);
  });
  it("formats time", () => {
    const now = Date.parse("2026-10-07T12:00:00Z");
    expect(timeAgo("2026-10-07T11:59:40Z", now)).toBe("now");
    expect(timeAgo("2026-10-07T11:55:00Z", now)).toBe("5m");
    expect(timeAgo("2026-10-07T09:00:00Z", now)).toBe("3h");
    expect(timeAgo("2026-10-05T12:00:00Z", now)).toBe("2d");
  });
});

import { fitWithin } from "../media/prepare";
describe("fitWithin", () => {
  it("caps the long edge at 1600 and never enlarges", () => {
    expect(fitWithin(4000, 3000)).toEqual({ w: 1600, h: 1200 });
    expect(fitWithin(3000, 4000)).toEqual({ w: 1200, h: 1600 });
    expect(fitWithin(800, 600)).toEqual({ w: 800, h: 600 });
  });
});
