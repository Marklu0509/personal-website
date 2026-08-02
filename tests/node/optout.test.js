import { describe, it, expect } from "vitest";
import { updateAndCheckOptOut } from "../../assets/optout.js";

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

describe("updateAndCheckOptOut", () => {
  it("opts out and persists when ?me=1 is present", () => {
    const s = fakeStorage();
    expect(updateAndCheckOptOut("?me=1", s)).toBe(true);
    // Still opted out on later visits without the param.
    expect(updateAndCheckOptOut("", s)).toBe(true);
    expect(s.getItem("mlu_optout")).toBe("1");
  });

  it("does not opt out a normal visitor", () => {
    const s = fakeStorage();
    expect(updateAndCheckOptOut("", s)).toBe(false);
    expect(updateAndCheckOptOut("?ref=twitter", s)).toBe(false);
  });

  it("matches ?me=1 among other params", () => {
    expect(updateAndCheckOptOut("?utm=x&me=1", fakeStorage())).toBe(true);
    expect(updateAndCheckOptOut("?me=12", fakeStorage())).toBe(false);
  });

  it("does not suppress when storage is unavailable", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(updateAndCheckOptOut("?me=1", broken)).toBe(false);
  });
});
