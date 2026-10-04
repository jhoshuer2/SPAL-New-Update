import { describe, it, expect } from "vitest";
import { parseQuickSale } from "./quick-sale";

describe("parseQuickSale", () => {
  it.each([
    ["sold 3 cartons for 45k", { item: "cartons", qty: 3, amountNaira: 45000 }],
    ["I sold 2 bags of rice for ₦30,000", { item: "bags of rice", qty: 2, amountNaira: 30000 }],
    ["zobo 1500", { item: "zobo", qty: null, amountNaira: 1500 }],
    ["sold 4 bread @ 500", { item: "bread", qty: 4, amountNaira: 2000 }], // @ = per unit
    ["3 cartons of indomie 45k", { item: "cartons of indomie", qty: 3, amountNaira: 45000 }],
    ["haircut for 2.5k", { item: "haircut", qty: null, amountNaira: 2500 }],
    ["sold generator for 1.2m", { item: "generator", qty: null, amountNaira: 1_200_000 }],
  ])("%s", (text, want) => expect(parseQuickSale(text)).toEqual(want));

  it("returns what it can and never invents an amount", () => {
    expect(parseQuickSale("sold some rice")).toEqual({ item: "some rice", qty: null, amountNaira: null });
    expect(parseQuickSale("")).toEqual({ item: "", qty: null, amountNaira: null });
    expect(parseQuickSale("42").amountNaira).toBeNull(); // a bare number alone is ambiguous
  });
});
