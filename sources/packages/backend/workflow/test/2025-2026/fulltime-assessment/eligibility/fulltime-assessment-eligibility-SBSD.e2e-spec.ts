import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-SBSD.`, () => {

  it("Should determine SBSD as eligible when the financial need is at least $1 and the student has PD status true.", async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(true);
        expect(
          calculatedAssessment.variables.provincialAwardNetSBSDAmount,
        ).toBeGreaterThan(0);
      });

  it("Should determine SBSD as not eligible when the financial need is at least $1 and the student has PD status false.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
