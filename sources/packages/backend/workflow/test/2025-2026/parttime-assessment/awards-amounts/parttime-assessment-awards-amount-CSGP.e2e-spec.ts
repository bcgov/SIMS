import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSGP.`, () => {
  it("Should determine federalAwardCSGPAmount when awardEligibilityCSGP is true and studentDataApplicationPDPPDStatus is yes", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.programYearTotalCSGP).toBe(130);
    expect(calculatedAssessment.variables.federalAwardNetCSGPAmount).toBe(2670);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGPAmount).toBe(
      2670,
    );
  });

  it("Should determine federalAwardNetCSGPAmount as zero when awardEligibilityCSGP is true and programYearTotalCSGP (programYearTotalFullTimeCSGP + programYearTotalPartTimeCSGP) is greater than the dmnPartTimeAwardAllowableLimits for CSGP ", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    assessmentConsolidatedData.programYearTotalFullTimeCSGP = 5000;
    assessmentConsolidatedData.programYearTotalPartTimeCSGP = 6000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGP).toBe(true);
    expect(calculatedAssessment.variables.programYearTotalCSGP).toBe(11000);
    expect(calculatedAssessment.variables.federalAwardNetCSGPAmount).toBe(0);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGPAmount).toBe(
      0,
    );
  });

  it("Should determine federalAwardCSGPAmount when awardEligibilityCSGP is true, no CSGP awarded in the program year previously and studentDataApplicationPDPPDStatus is yes", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    assessmentConsolidatedData.programYearTotalFullTimeCSGP = undefined;
    assessmentConsolidatedData.programYearTotalPartTimeCSGP = undefined;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.programYearTotalCSGP).toBe(0);
    expect(calculatedAssessment.variables.federalAwardNetCSGPAmount).toBe(2800);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGPAmount).toBe(
      2800,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
