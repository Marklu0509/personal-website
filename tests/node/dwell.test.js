import { describe, it, expect } from "vitest";
import { accumulateDwell } from "../../assets/dwell.js";

describe("accumulateDwell", () => {
  it("sums a single enter/exit into dwell_ms", () => {
    const dwell = accumulateDwell([
      { section: "about", type: "enter", t: 1000 },
      { section: "about", type: "exit", t: 4500 },
    ]);
    expect(dwell).toEqual({ about: 3500 });
  });

  it("sums multiple visits to the same section", () => {
    const dwell = accumulateDwell([
      { section: "a", type: "enter", t: 0 },
      { section: "a", type: "exit", t: 1000 },
      { section: "a", type: "enter", t: 5000 },
      { section: "a", type: "exit", t: 5500 },
    ]);
    expect(dwell).toEqual({ a: 1500 });
  });

  it("tracks several sections independently", () => {
    const dwell = accumulateDwell([
      { section: "a", type: "enter", t: 0 },
      { section: "b", type: "enter", t: 200 },
      { section: "a", type: "exit", t: 1000 },
      { section: "b", type: "exit", t: 1200 },
    ]);
    expect(dwell).toEqual({ a: 1000, b: 1000 });
  });

  it("ignores an enter with no matching exit", () => {
    const dwell = accumulateDwell([{ section: "a", type: "enter", t: 0 }]);
    expect(dwell).toEqual({});
  });

  it("ignores a stray exit with no open enter", () => {
    const dwell = accumulateDwell([{ section: "a", type: "exit", t: 500 }]);
    expect(dwell).toEqual({});
  });

  it("rounds fractional milliseconds", () => {
    const dwell = accumulateDwell([
      { section: "a", type: "enter", t: 0.2 },
      { section: "a", type: "exit", t: 10.9 },
    ]);
    expect(dwell).toEqual({ a: 11 });
  });
});
