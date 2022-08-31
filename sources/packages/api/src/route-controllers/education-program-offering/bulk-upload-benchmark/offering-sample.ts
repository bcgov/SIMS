import { ProgramIntensity } from "src/database/entities";

export const OFFERING_SAMPLE = {
  offeringName: "Sample test", // ok
  yearOfStudy: 1, // ok
  showYearOfStudy: true, // ok
  offeringIntensity: "Full Time", // ok
  programOfferingIntensityMismatch: false,
  offeringDelivered: "blended", // ok
  programOfferingDeliveryMismatch: false,
  hasOfferingWILComponent: "no", // ok
  programOfferingWILMismatch: false,
  studyStartDate: "2022-08-01", // ok
  studyEndDate: "2022-11-19", // ok
  ineligibleDaysForFundingAfter10PercentageCalculation: 20,
  allowable10Percentage: 11,
  invalidStudyDates: false,
  lacksStudyBreaks: false, // ok
  // ok
  breaksAndWeeks: {
    studyBreaks: [
      {
        breakStartDate: "2022-08-11T00:00:00-07:00",
        breakEndDate: "2022-08-20T00:00:00-07:00",
        breakDays: 9,
        eligibleBreakDays: 9,
        ineligibleBreakDays: 0,
      },
      {
        breakStartDate: "2022-08-28T00:00:00-07:00",
        breakEndDate: "2022-09-10T00:00:00-07:00",
        breakDays: 13,
        eligibleBreakDays: 13,
        ineligibleBreakDays: 0,
      },
      {
        breakStartDate: "2022-09-25T00:00:00-07:00",
        breakEndDate: "2022-10-04T00:00:00-07:00",
        breakDays: 9,
        eligibleBreakDays: 9,
        ineligibleBreakDays: 0,
      },
    ],
    totalDays: 110,
    totalFundedWeeks: 13,
    fundedStudyPeriodDays: 90,
    unfundedStudyPeriodDays: 20,
  },
  sumOfTotalEligibleBreakDays: 31,
  sumOfTotalInEligibleBreakDays: 0,
  invalidStudyBreaks: true,
  studyBreaksOverlappingDetection: false,
  actualTuitionCosts: 123, // ok
  programRelatedCosts: 456, // ok
  mandatoryFees: 789, // ok
  exceptionalExpenses: 10, // ok
  offeringType: "Public", // ok
  offeringDeclaration: true, //  ok
  clientType: "institution",
  applicationId: "",
  applicationStatus: "",
  offeringStatus: "Creation pending", // ok
  offeringStatusToDisplay: "",
  programIntensity: "Full Time and Part Time",
  programDeliveryTypes: {
    deliveredOnSite: true,
    deliveredOnline: true,
  },
  hasWILComponent: "no", // ok - hasOfferingWILComponent
};

export const OFFERING_SAMPLE_NO_DRY_RUN = {
  locationId: 3,
  offeringType: "Public", // ok
  offeringDeclaration: true, //  ok
  offeringName: "Test", // ok
  yearOfStudy: 1, // ok
  showYearOfStudy: true, // ok
  offeringIntensity: "Part Time", // ok
  offeringDelivered: "blended", // ok
  hasOfferingWILComponent: "no", // ok
  programOfferingWILMismatch: false,
  studyStartDate: "2022-08-01", // ok
  studyEndDate: "2022-11-19", // ok
  lacksStudyBreaks: false, // ok
  // ok
  studyBreaks: [
    {
      breakStartDate: "2022-08-01",
      breakEndDate: "2022-08-20",
    },
    {
      breakStartDate: "2022-08-28",
      breakEndDate: "2022-09-10",
    },
    {
      breakStartDate: "2022-09-25",
      breakEndDate: "2022-10-04",
    },
  ],
  actualTuitionCosts: 123, // ok
  programRelatedCosts: 456, // ok
  mandatoryFees: 789, // ok
  exceptionalExpenses: 10, // ok
  programDeliveryTypes: {
    deliveredOnSite: false,
    deliveredOnline: true,
  },
  programContext: {
    id: 1,
    programIntensity: ProgramIntensity.fullTime,
    hasWILComponent: "no",
    deliveredOnSite: true,
    deliveredOnline: true,
  },
};
