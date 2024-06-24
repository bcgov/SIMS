import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGP.`, () => {
  it("Should determine CSGP as eligible when financial need is at least $1 and the student has PD status as true.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // 4000 is the const value set on dmnFullTimeAwardFederalAllowableLimits.limitAwardCSGPAmount.
    // When the CSGP is eligible its amount will always be 4000. The same value is expected for
    // provincial and federal grants.
    expect(calculatedAssessment.variables.federalAwardNetCSGPAmount).toBe(4000);
    expect(calculatedAssessment.variables.provincialAwardNetCSGPAmount).toBe(
      4000,
    );
    expect(calculatedAssessment.variables.awardEligibilityCSGP).toBe(true);
  });

  it("Should determine CSGP as not eligible when financial need is at least $1 and the student has PD status as false.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGP).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
