import { OfferingStudyBreakCalculationContext } from "../../education-program-offering-validation.models";
import { EducationProgramOfferingService } from "../../education-program-offering.service";

describe("EducationProgramOfferingService-getCalculatedStudyBreaksAndWeeks", () => {
  it("Should calculate funded study period and total days when study start and end study dates are available.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "2023-01-01",
        studyEndDate: "2023-01-10",
        studyBreaks: [],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: 1,
      fundedStudyPeriodDays: 10,
      studyBreaks: [],
      sumOfTotalEligibleBreakDays: 0,
      sumOfTotalIneligibleBreakDays: 0,
      totalDays: 10,
      totalFundedWeeks: 2,
      unfundedStudyPeriodDays: 0,
    });
  });

  it("Should not calculate funded study period days and total days when study start date is not available.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "",
        studyEndDate: "2023-01-10",
        studyBreaks: [],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: NaN,
      fundedStudyPeriodDays: NaN,
      studyBreaks: [],
      sumOfTotalEligibleBreakDays: 0,
      sumOfTotalIneligibleBreakDays: 0,
      totalDays: NaN,
      totalFundedWeeks: NaN,
      unfundedStudyPeriodDays: NaN,
    });
  });

  it("Should not calculate funded study period days and total days when study end date is not available.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "2023-01-01",
        studyEndDate: "",
        studyBreaks: [],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: NaN,
      fundedStudyPeriodDays: NaN,
      studyBreaks: [],
      sumOfTotalEligibleBreakDays: 0,
      sumOfTotalIneligibleBreakDays: 0,
      totalDays: NaN,
      totalFundedWeeks: NaN,
      unfundedStudyPeriodDays: NaN,
    });
  });

  it("Should calculate study breaks when start and end study break dates available.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "",
        studyEndDate: "",
        studyBreaks: [
          {
            breakStartDate: "2023-05-29",
            breakEndDate: "2023-06-06",
          },
          {
            breakStartDate: "2023-06-08",
            breakEndDate: "2023-06-13",
          },
        ],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: NaN,
      fundedStudyPeriodDays: NaN,
      studyBreaks: [
        {
          breakDays: 9,
          breakEndDate: "2023-06-06",
          breakStartDate: "2023-05-29",
          eligibleBreakDays: 9,
          ineligibleBreakDays: 0,
        },
        {
          breakDays: 6,
          breakEndDate: "2023-06-13",
          breakStartDate: "2023-06-08",
          eligibleBreakDays: 6,
          ineligibleBreakDays: 0,
        },
      ],
      sumOfTotalEligibleBreakDays: 15,
      sumOfTotalIneligibleBreakDays: 0,
      totalDays: NaN,
      totalFundedWeeks: NaN,
      unfundedStudyPeriodDays: NaN,
    });
  });

  it("Should not calculate study breaks when start study break date is not available.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "",
        studyEndDate: "",
        studyBreaks: [
          {
            breakStartDate: "",
            breakEndDate: "2023-06-06",
          },
        ],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: NaN,
      fundedStudyPeriodDays: NaN,
      studyBreaks: [],
      sumOfTotalEligibleBreakDays: 0,
      sumOfTotalIneligibleBreakDays: 0,
      totalDays: NaN,
      totalFundedWeeks: NaN,
      unfundedStudyPeriodDays: NaN,
    });
  });

  it("Should not calculate study breaks when end study break date is not available.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "",
        studyEndDate: "",
        studyBreaks: [
          {
            breakStartDate: "2023-06-06",
            breakEndDate: "",
          },
        ],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: NaN,
      fundedStudyPeriodDays: NaN,
      studyBreaks: [],
      sumOfTotalEligibleBreakDays: 0,
      sumOfTotalIneligibleBreakDays: 0,
      totalDays: NaN,
      totalFundedWeeks: NaN,
      unfundedStudyPeriodDays: NaN,
    });
  });

  it("Should calculate eligible break days as a maximum of 21 days when a study break exceeds it.", () => {
    //Arrange
    const offeringStudyBreakCalculationContext: OfferingStudyBreakCalculationContext =
      {
        studyStartDate: "2023-05-29",
        studyEndDate: "2023-09-29",
        studyBreaks: [
          {
            breakStartDate: "2023-06-08",
            breakEndDate: "2023-06-30",
          },
        ],
      };

    // Act
    const calculatedStudyBreaksAndWeeks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        offeringStudyBreakCalculationContext,
      );

    // Assert
    expect(calculatedStudyBreaksAndWeeks).toEqual({
      allowableStudyBreaksDaysAmount: 12.4,
      fundedStudyPeriodDays: 113.4,
      studyBreaks: [
        {
          breakDays: 23,
          breakEndDate: "2023-06-30",
          breakStartDate: "2023-06-08",
          eligibleBreakDays: 21,
          ineligibleBreakDays: 2,
        },
      ],
      sumOfTotalEligibleBreakDays: 21,
      sumOfTotalIneligibleBreakDays: 2,
      totalDays: 124,
      totalFundedWeeks: 17,
      unfundedStudyPeriodDays: 10.6,
    });
  });
});
