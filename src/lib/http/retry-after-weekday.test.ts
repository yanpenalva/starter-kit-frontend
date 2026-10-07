import { expect, it, vi } from "vitest";
import { parseRetryAfterSeconds } from "@/lib/http";

const OCTOBER_SUNDAY_WEEKDAYS: readonly (readonly [string, number])[] = [
  ["Mon", 1],
  ["Tue", 2],
  ["Wed", 3],
  ["Thu", 4],
  ["Fri", 5],
  ["Sat", 6],
  ["Sun", 0],
];

it.each(OCTOBER_SUNDAY_WEEKDAYS)(
  "validates %s against UTC weekday index %i",
  (weekday, utcDay) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
    try {
      expect(new Date("2026-10-04T12:00:00Z").getUTCDay()).toBe(0);
      const actual = parseRetryAfterSeconds(
        `${weekday}, 04 Oct 2026 12:02:00 GMT`,
      );
      expect(actual).toBe(utcDay === 0 ? 120 : null);
    } finally {
      vi.useRealTimers();
    }
  },
);

it("rejects an expired date while retaining positive date and seconds forms", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-04T12:00:00Z"));
  try {
    expect(parseRetryAfterSeconds("Mon, 04 Oct 2026 12:02:00 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("Sun, 04 Oct 2026 12:02:00 GMT")).toBe(120);
    expect(parseRetryAfterSeconds("Sun, 04 Oct 2026 11:59:59 GMT")).toBeNull();
    expect(parseRetryAfterSeconds("8")).toBe(8);
  } finally {
    vi.useRealTimers();
  }
});
