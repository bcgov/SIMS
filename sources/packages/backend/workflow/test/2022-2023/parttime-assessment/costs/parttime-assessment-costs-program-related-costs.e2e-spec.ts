import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-program-related-costs.`, () => {
  it(
    "Should use minimum (offering program related costs) " +
      "when dmn limit for books and supplies * number of offering weeks has a higher value.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      // A lower value than dmnPartTimeProgramYearMaximums.limitWeeklyBooksAndSupplies * offeringWeeks.
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
    "Should use minimum (dmn limit for books and supplies * number of offering weeks) " +
      "when offering program related costs has a higher value.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      // A higher value than dmnPartTimeProgramYearMaximums.limitWeeklyBooksAndSupplies * offeringWeeks.
      assessmentConsolidatedData.offeringProgramRelatedCosts = 1750;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalAssessedNeed,
      ).toBe(22972);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
