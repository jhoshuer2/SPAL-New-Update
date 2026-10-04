import { describe, it, expect } from "vitest";
import { extractJSON } from "./claude";

describe("extractJSON", () => {
  it("parses plain JSON", () => expect(extractJSON('{"a":1}')).toEqual({ a: 1 }));
  it("parses fenced JSON with chatter", () =>
    expect(extractJSON('Sure!\n```json\n{"records":[{"amount":5}]}\n```')).toEqual({ records: [{ amount: 5 }] }));
  it("returns {} on garbage", () => expect(extractJSON("no json here")).toEqual({}));
});
