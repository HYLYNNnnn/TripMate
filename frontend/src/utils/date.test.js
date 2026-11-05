import { formatLocalDate, inclusiveCalendarDays } from "./date";

describe("travel calendar dates", () => {
  test("preserves the selected local day instead of converting it to UTC", () => {
    // Running in Asia/Shanghai reproduces the previous ISO conversion's one-day shift.
    expect(formatLocalDate(new Date(2026, 5, 10))).toBe("2026-06-10");
    expect(formatLocalDate(new Date(2026, 0, 2))).toBe("2026-01-02");
  });

  test("counts both calendar endpoints, including a same-day trip", () => {
    expect(inclusiveCalendarDays(new Date(2026, 5, 10), new Date(2026, 5, 10))).toBe(1);
    expect(inclusiveCalendarDays(new Date(2026, 5, 10), new Date(2026, 5, 12))).toBe(3);
  });

  test("does not lose a day across the spring daylight-saving transition", () => {
    expect(inclusiveCalendarDays(new Date(2026, 2, 7), new Date(2026, 2, 9))).toBe(3);
  });

  test("rejects invalid, missing and reversed dates", () => {
    expect(formatLocalDate(new Date("invalid"))).toBeNull();
    expect(formatLocalDate(null)).toBeNull();
    expect(inclusiveCalendarDays(null, new Date())).toBe(0);
    expect(inclusiveCalendarDays(new Date("invalid"), new Date())).toBe(0);
    expect(inclusiveCalendarDays(new Date(2026, 5, 12), new Date(2026, 5, 10))).toBe(0);
  });
});
