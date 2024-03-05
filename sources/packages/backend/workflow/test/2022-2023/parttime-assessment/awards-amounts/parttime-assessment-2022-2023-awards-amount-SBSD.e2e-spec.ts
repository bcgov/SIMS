import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
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
    expect(
      calculatedAssessment.variables.programYearTotalSBSD,
    ).toBe(90);
    expect(calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
      .limitAwardSBSD40AndUpCourseLoadAmount).toBe(
      800,
    );
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(710);
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
    expect(
      calculatedAssessment.variables.programYearTotalSBSD,
    ).toBe(90);
    expect(calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
      .limitAwardSBSDUnder40CourseLoadAmount).toBe(
      400,
    );
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(310);
  });

  it("Should determine provincialAwardNetSBSDAmount as zero when awardEligibilitySBSD is true, programYearTotalSBSD (programYearTotalFullTimeSBSD + programYearTotalPartTimeSBSD) is greater than the dmnPartTimeAwardAllowableLimits ", async () => {
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
    expect(calculatedAssessment.variables.programYearTotalSBSD,
    ).toBe(1100);
    expect(calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
      .limitAwardSBSD40AndUpCourseLoadAmount).toBe(
      800,
    );
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(0);
  });

  it("Should determine provincialAwardNetSBSDAmount as zero when awardEligibilitySBSD is false", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);

    assessmentConsolidatedData.studentDataCRAReportedIncome = 70001;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
    expect(calculatedAssessment.variables.provincialAwardNetSBSDAmount).toBe(0);
  });
});
