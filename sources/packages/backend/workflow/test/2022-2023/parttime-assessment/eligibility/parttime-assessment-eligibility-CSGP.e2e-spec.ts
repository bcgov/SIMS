import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-CSGP.`, () => {
  it(
    "Should determine CSGP as eligible when total assessed need is greater than or equal to 1 " +
      "and application PD/PPD status is true.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.awardEligibilityCSGP).toBe(true);
      expect(
        calculatedAssessment.variables.finalFederalAwardNetCSGPAmount,
      ).toBeGreaterThan(0);
    },
  );

  it("Should determine CSGP as not eligible when application PD/PPD status is not 'yes'.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus =
      "noIDoNotHaveADisability";

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGP).toBe(false);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGPAmount).toBe(
      0,
    );
  });
});
