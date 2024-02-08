import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentChildCareEligibility,
  createFakeStudentDependentEligibleForChildcareCost,
  createFakeStudentDependentNotEligibleForChildcareCost,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow part-time-assessment-${PROGRAM_YEAR}-costs-child-care-costs.`, () => {
  it(
    "Should calculate child care costs when student has one or more dependents on both categories" +
      "(11 years and under and over 12 years and declared on taxes for disability) and " +
      "child care costs entered does not reach maximum allowable limit for the " +
      "given number of dependents, course load and offering weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 300;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 300;
      assessmentConsolidatedData.offeringWeeks = 8;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 2 eligible dependents.
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible12YearsAndOver,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];
      const totalChildcareCostEnteredInApplication =
        assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder +
        assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Child care cost expected to be studentDataDaycareCosts11YearsOrUnder + studentDataDaycareCosts12YearsOrOver.

      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        totalChildcareCostEnteredInApplication,
      );

      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(totalChildcareCostEnteredInApplication);
    },
  );

  it(
    "Should calculate child care costs when student has one or more dependents on both categories" +
      "(11 years and under and over 12 years and declared on taxes for disability) and " +
      "child care costs entered is beyond maximum allowable limit for the " +
      "given number of dependents, course load and offering weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 2000;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 2000;
      assessmentConsolidatedData.offeringWeeks = 8;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 2 eligible dependents.
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible12YearsAndOver,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];
      const totalChildcareCostEnteredInApplication =
        assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder +
        assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        totalChildcareCostEnteredInApplication,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBeLessThan(totalChildcareCostEnteredInApplication);
    },
  );

  it(
    "Should calculate child care costs as 0 when student has one or more dependents on both categories(11 years and under and over 12 years " +
      " and declared on taxes for disability) but child care costs not provided in student application.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 8;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 4 eligible and 4 not eligible dependents.
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible12YearsAndOver,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Child care cost expected to be studentDataDaycareCosts11YearsOrUnder + studentDataDaycareCosts12YearsOrOver.

      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        0,
      );
    },
  );

  it(
    "Should calculate child care costs as 0 when student does not have any eligible dependant for child care cost(11 years and under and over12 years " +
      " and declared on taxes for disability).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 300;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 300;
      assessmentConsolidatedData.offeringWeeks = 8;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 1 not eligible dependant.
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentNotEligibleForChildcareCost(
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Child care cost expected to be studentDataDaycareCosts11YearsOrUnder + studentDataDaycareCosts12YearsOrOver.
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        0,
      );
    },
  );
});
