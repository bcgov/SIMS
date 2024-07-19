import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentChildCareEligibility,
  createFakeStudentDependentBornAfterStudyEndDate,
  createFakeStudentDependentEligibleForChildcareCost,
  createFakeStudentDependentNotEligibleForChildcareCost,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow part-time-assessment-${PROGRAM_YEAR}-costs-child-care-costs.`, () => {
  it(
    "Should calculate total child care cost as sum of values in student application when student has one or more dependents " +
      " on both categories (11 years or under and 12 years or over and declared on taxes for disability) and " +
      "child care costs entered does not reach maximum allowable limit for the " +
      "given number of dependents, course load and offering weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 1000;
      // Offering weeks set to 18 will increase the maximum allowable limit for child care costs.
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 2 eligible dependents.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
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
      // Childcare cost for the category 11 years and under must be equal to the value entered in application
      // for this category as student has one or more dependent in this category.
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts11YearsOrUnder,
      ).toBe(assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder);
      // Childcare cost for the category 12 years and over under must be equal to the value entered in application
      // for this category as student has one or more dependent in this category.
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts12YearsOrOver,
      ).toBe(assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver);
      // Child care cost expected to be the total sum of values entered in student application.
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        totalChildcareCostEnteredInApplication,
      );
      // As the total sum of child care costs are within the maximum allowable limit the total
      // must be considered as it is towards assessed need.
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(totalChildcareCostEnteredInApplication);
    },
  );

  it(
    "Should calculate child care costs as maximum allowed limit when student has one or more dependents on both categories " +
      "(11 years or under and 12 years or over and declared on taxes for disability) and " +
      "child care costs entered is beyond maximum allowable limit for the " +
      "given number of dependents, course load and offering weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 1000;
      assessmentConsolidatedData.offeringWeeks = 17;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 2 eligible dependents.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
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
      // Childcare cost for the category 11 years and under must be equal to the value entered in application
      // for this category as student has one or more dependent in this category.
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts11YearsOrUnder,
      ).toBe(assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder);
      // Childcare cost for the category 12 years and over under must be equal to the value entered in application
      // for this category as student has one or more dependent in this category.
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts12YearsOrOver,
      ).toBe(assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver);
      // Child care cost expected to be the total sum of values entered in student application.
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        totalChildcareCostEnteredInApplication,
      );
      // As the total sum of child care costs are beyond the maximum allowable limit
      // the maximum limit must be considered towards assessed need.
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(1822.4);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBeLessThan(
        calculatedAssessment.variables.calculatedDataChildCareCost,
      );
    },
  );

  it(
    "Should calculate child care costs as 0 when student has one or more dependents on both categories(11 years or under and 12 years " +
      " or over and declared on taxes for disability) but child care costs not provided in student application.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 8;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Creates 4 eligible and 4 not eligible dependents.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
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
      // Child care cost must be 0 for the student application.
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        0,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(0);
    },
  );

  it(
    "Should calculate child care costs as 0 when student does not have any eligible dependant for child care cost(11 years or under or 12 years or over " +
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
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
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
      // Childcare cost for the category 11 years and under must be 0
      // as the student does not have any dependent in this category.
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts11YearsOrUnder,
      ).toBe(0);
      // Childcare cost for the category 12 years and over must be 0
      // as the student does not have any dependent in this category.
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts12YearsOrOver,
      ).toBe(0);
      // Child care cost must be 0 for the student application.
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        0,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(0);
    },
  );

  it("Should calculate child care costs as 0 when student does not have any dependant born on or before study end date.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 300;
    assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 300;
    assessmentConsolidatedData.offeringWeeks = 8;
    assessmentConsolidatedData.offeringCourseLoad = 20;
    // Dependent(s) born after study end date are not considered
    // as eligible for any calculation.
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentBornAfterStudyEndDate(
        assessmentConsolidatedData.offeringStudyEndDate,
      ),
    ];
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Childcare cost for the category 11 years and under must be 0
    // as the student does not have any dependent in this category.
    expect(
      calculatedAssessment.variables.calculatedDataDaycareCosts11YearsOrUnder,
    ).toBe(0);
    // Childcare cost for the category 12 years and over must be 0
    // as the student does not have any dependent in this category.
    expect(
      calculatedAssessment.variables.calculatedDataDaycareCosts12YearsOrOver,
    ).toBe(0);
    // Child care cost must be 0 for the student application.
    expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(0);
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildCareCost,
    ).toBe(0);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
