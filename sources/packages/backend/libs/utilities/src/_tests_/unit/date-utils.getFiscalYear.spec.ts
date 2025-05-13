import { getFiscalYear, getISODateOnlyString } from "../../date-utils";

describe("DateUtils-getFiscalYear", () => {
  [
    { date: "2024-01-01", fiscalYear: 2024 },
    { date: "2024-03-31", fiscalYear: 2024 },
    { date: "2024-03-31 23:59:59:999", fiscalYear: 2024 },
    { date: "2024-04-01", fiscalYear: 2025 },
    { date: "2025-03-31", fiscalYear: 2025 },
    { date: "2025-04-01", fiscalYear: 2026 },
    { date: "2025-12-31", fiscalYear: 2026 },
  ].forEach(({ date, fiscalYear }) => {
    it(`Should return fiscal year ${fiscalYear} when the date is ${getISODateOnlyString(
      date,
    )}.`, () => {
      const testDate = new Date(date);
      const result = getFiscalYear(testDate);
      expect(result).toBe(fiscalYear);
    });
  });
});
