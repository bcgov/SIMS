import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-PDPPD-status.`, () => {
  it("Should be true when student selected PDPPD status through the application.", async () => {
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
    expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(true);
  });
  it("Should be true when student request a change selecting 'Yes, I have disability and want this application to be assessed for disability funding.'", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
      disabilityInformation: "yes",
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(true);
  });
  it("Should be false when student request a change selecting 'No, I want to access other funding types while I wait for a verification decision.'", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
      disabilityInformation: "noIWantToAccessOtherFundingTypes",
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(
      false,
    );
  });
  it("Should be false when student request a change selecting 'No, I do not have a disability.'", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
      disabilityInformation: "noIDoNotHaveADisability",
    };

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(
      false,
    );
  });
});
