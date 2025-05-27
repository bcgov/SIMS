import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-program-related-costs.`, () => {
  it(
    "Should get program related costs as offering program related costs" +
      "when the offering program related costs are less than or equal to the DMN limit for books and supplies.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 1730;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataProgramRelatedCosts,
      ).toBe(1730);
    },
  );

  it(
    "Should get program related costs as the DMN limit for books and supplies " +
      "when the offering program related costs are greater than the DMN limit for books and supplies.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 4000;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataProgramRelatedCosts,
      ).toBe(3000);
    },
  );

  it(
    "Should get program related costs as the offering program related costs minus program year total part-time books and supplies cost " +
      "when there is a program year total part-time books and supplies cost less than the offering program related costs.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 3000;
      assessmentConsolidatedData.programYearTotalPartTimeBooksAndSuppliesCost = 500;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataProgramRelatedCosts,
      ).toBe(2500);
    },
  );

  it(
    "Should get program related costs as the offering program related costs minus program year total part-time books and supplies cost " +
      "when there is a program year total part-time books and supplies cost greater than the offering program related costs.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 1000;
      assessmentConsolidatedData.programYearTotalPartTimeBooksAndSuppliesCost = 3000;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataProgramRelatedCosts,
      ).toBe(0);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
