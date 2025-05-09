import { getFiscalYear, getISODateOnlyString } from "../../date-utils";

describe("DateUtils-getCurrentFiscalYear", () => {
  [
    { date: "2024-02-01", fiscalYear: 2023 },
    { date: "2024-04-01", fiscalYear: 2024 },
    { date: "2025-03-31", fiscalYear: 2024 },
    { date: "2025-04-01", fiscalYear: 2025 },
    { date: "2025-12-31", fiscalYear: 2025 },
    { date: "2026-05-01", fiscalYear: 2026 },
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
