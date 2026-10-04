import { describe, it, expect } from "vitest";
import { redact, scanPrivate } from "./privacy";

const kinds = (t: string) => scanPrivate(t).map((f) => f.kind);

describe("scanPrivate", () => {
  it("finds naira amounts in the ways Nigerians write them", () => {
    for (const t of ["I made ₦45,000 today", "sold for N5000", "profit was NGN 120,000", "paid 2500 naira", "I earned 30k this week", "my sales hit 1.2m", "stock worth 1,500,000"]) {
      expect(kinds(t), t).toContain("amount");
    }
  });
  it("finds phone numbers in local and international form", () => {
    for (const t of ["call me 08031234567", "+234 803 123 4567", "0803-123-4567", "2348031234567"]) expect(kinds(t), t).toEqual(["phone"]);
  });
  it("finds account numbers (10 digits) but does not confuse a phone number for one", () => {
    expect(kinds("send to 0123456789")).toEqual(["account"]);
    expect(kinds("ring 08031234567")).toEqual(["phone"]);
  });
  it("finds emails", () => expect(kinds("mail ada@shop.com")).toEqual(["email"]));
  it("leaves ordinary posts alone", () => {
    for (const t of ["Today I registered my business and I'm so happy!", "I have 20k followers on Instagram", "Level 2 reached after 3 months", "Opened my 2nd shop"]) expect(scanPrivate(t), t).toEqual([]);
  });
  it("reports one finding per detail, not overlapping ones", () => {
    expect(scanPrivate("I made ₦45,000")).toHaveLength(1);
  });
  it("redacts without breaking the sentence", () => {
    const t = "I made ₦45,000, call 08031234567 or ada@shop.com";
    expect(redact(t, scanPrivate(t))).toBe("I made [amount hidden], call [phone hidden] or [email hidden]");
  });
});
