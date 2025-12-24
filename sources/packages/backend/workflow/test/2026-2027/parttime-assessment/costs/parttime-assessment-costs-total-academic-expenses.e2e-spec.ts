import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-total-academic-expenses.`, () => {
  it(
    "Should determine calculatedDataTotalAcademicExpenses when offering weeks is 30, " +
      "without additional transportation weeks and offering is delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      assessmentConsolidatedData.offeringActualTuitionCosts = 500;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 200;
      assessmentConsolidatedData.offeringMandatoryFees = 200;
      assessmentConsolidatedData.programYearTotalPartTimeBooksAndSuppliesCost = 250;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalAcademicExpenses,
      ).toBe(1630);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
