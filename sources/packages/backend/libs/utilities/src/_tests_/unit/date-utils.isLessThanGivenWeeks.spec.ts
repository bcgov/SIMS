import {
  addDays,
  getISODateOnlyString,
  isLessThanGivenWeeks,
} from "@sims/utilities/date-utils";

describe("DateUtils-isLessThanGivenWeeks", () => {
  [
    // Happy paths tests which should return false.
    {
      date: "2025-11-25",
      weeks: 4,
      referenceDate: "2025-10-28",
      expectedResult: false,
    },
    {
      date: "2025-12-12",
      weeks: 6,
      referenceDate: "2025-10-28",
      expectedResult: false,
    },
    {
      date: "2025-10-22",
      weeks: -1,
      referenceDate: "2025-10-28",
      expectedResult: false,
    },
    {
      date: "2025-10-15",
      weeks: -2,
      referenceDate: "2025-10-28",
      expectedResult: false,
    },
    {
      date: "2025-11-02",
      weeks: 0.5,
      referenceDate: "2025-10-28",
      expectedResult: false,
    },
    // Failure tests which should return true.
    {
      date: addDays(2),
      weeks: 0.5,
      // When reference date is not provided, current date is expected to be used by the function.
      referenceDate: undefined,
      expectedResult: true,
    },
    {
      date: "2025-11-02",
      weeks: 3,
      referenceDate: "2025-10-28",
      expectedResult: true,
    },
    {
      date: "2025-11-24",
      weeks: 4,
      referenceDate: "2025-10-28",
      expectedResult: true,
    },
    {
      date: "2025-10-13",
      weeks: -2,
      referenceDate: "2025-10-28",
      expectedResult: true,
    },
  ].forEach(({ weeks, date, referenceDate, expectedResult }) => {
    it(`Should return ${expectedResult} when the provided date is ${getISODateOnlyString(date)} and the reference date is ${referenceDate ?? getISODateOnlyString(new Date())} and the weeks is ${weeks}.`, () => {
      const result = isLessThanGivenWeeks(date, weeks, { referenceDate });
      expect(result).toBe(expectedResult);
    });
  });
});
