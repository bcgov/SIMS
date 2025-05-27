import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-program-related-costs.`, () => {
  it(
    "Should get program related costs as offering program related costs when the DMN limit for books and supplies " +
      "minus the program year total part-time books and supplies cost has the greater value.",
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
        calculatedAssessment.variables.calculatedDataTotalAssessedNeed,
      ).toBe(22962);
    },
  );

  it(
    "Should get program related costs as the DMN limit for books and supplies " +
      "minus the program year total part-time books and supplies cost when offering program related costs has the greater value.",
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
        calculatedAssessment.variables.calculatedDataTotalAssessedNeed,
      ).toBe(24232);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
