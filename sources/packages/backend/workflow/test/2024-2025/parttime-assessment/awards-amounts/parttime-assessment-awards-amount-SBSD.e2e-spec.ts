import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-SBSD.`, () => {
  it("Should determine provincialAwardSBSDAmount when awardEligibilitySBSD is true and offeringCourseLoad is 40 and up", async () => {
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
    expect(calculatedAssessment.variables.programYearTotalSBSD).toBe(90);
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(
      710,
    );
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(710);
  });

  it("Should determine provincialAwardSBSDAmount when awardEligibilitySBSD is true and offeringCourseLoad is < 40", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    assessmentConsolidatedData.offeringCourseLoad = 39;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.programYearTotalSBSD).toBe(90);
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(
      310,
    );
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(310);
  });

  it("Should determine provincialAwardNetSBSDAmount as zero when awardEligibilitySBSD is true, programYearTotalSBSD (programYearTotalFullTimeSBSD + programYearTotalPartTimeSBSD) is greater than the dmnPartTimeAwardAllowableLimits for SBSD ", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    assessmentConsolidatedData.programYearTotalFullTimeSBSD = 500;
    assessmentConsolidatedData.programYearTotalPartTimeSBSD = 600;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(true);
    expect(calculatedAssessment.variables.programYearTotalSBSD).toBe(1100);
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(0);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(0);
  });

  it("Should determine provincialAwardNetSBSDAmount as zero when awardEligibilitySBSD is false", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(0);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(0);
  });

  it("Should determine provincialAwardSBSDAmount when awardEligibilitySBSD is true, no SBSD awarded in the program year previously and offeringCourseLoad is 40 and up", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    assessmentConsolidatedData.programYearTotalPartTimeSBSD = undefined;
    assessmentConsolidatedData.programYearTotalFullTimeSBSD = undefined;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.programYearTotalSBSD).toBe(0);
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(
      800,
    );
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(800);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
