import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-CSLP.`, () => {
  it(
    "Should determine CSLP as eligible when total assessed need is greater than or equal to 1 " +
      "and total family income is less than the threshold.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 1000;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.awardEligibilityCSLP).toBe(true);
      expect(
        calculatedAssessment.variables.federalAwardNetCSLPAmount,
      ).toBeGreaterThan(0);
      expect(
        calculatedAssessment.variables.finalFederalAwardNetCSLPAmount,
      ).toBeGreaterThan(0);
    },
  );

  it("Should determine CSLP as not eligible when total family income is greater than the threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 72644;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSLP).toBe(false);
    expect(calculatedAssessment.variables.federalAwardNetCSLPAmount).toBe(0);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSLPAmount).toBe(
      0,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
