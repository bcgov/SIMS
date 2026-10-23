import { getPCTDateTimeWithTimezone } from "../../date-utils";

describe("DateUtils-getPCTDateTimeWithTimezone", () => {
  [
    { date: "2027-01-15T19:00:00Z", expected: "2027-01-15 12:00:00 PCT" },
    { date: "2027-07-15T19:00:00Z", expected: "2027-07-15 12:00:00 PCT" },
  ].forEach(({ date, expected }) => {
    it(`Should return ${expected} (UTC−07:00) when the date is ${date}.`, () => {
      const result = getPCTDateTimeWithTimezone(date);
      expect(result).toBe(expected);
    });
  });
});
