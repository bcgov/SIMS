import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-PDPPD-status.`, () => {
  it("Should be true when student selected PD/PPD status through the application without any appeal.", async () => {
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
    expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(true);
  });

  it(
    "Should calculate the PD/PPD status to true when student did not choose to apply with disability funding " +
      "while waits for a decision in student application and then requested a change later with disability funding.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "no";
      assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
        studentNewPDPPDStatus: "yes",
      };

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(
        true,
      );
    },
  );

  it(
    "Should calculate the PD/PPD status to true when student did not choose to apply " +
      "with disability funding in student application and then requested a change later with disability funding.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "no";
      assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
        studentNewPDPPDStatus: "yes",
      };

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(
        true,
      );
    },
  );

  it(
    "Should calculate the PD/PPD status to false when student chose to apply with disability funding " +
      "in student application and then requested a change later with no disability funding while wait for a decision.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
      assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
        studentNewPDPPDStatus: "no",
      };

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(
        false,
      );
    },
  );

  it(
    "Should calculate the PD/PPD status to false when student chose to apply with disability funding " +
      "in student application and then requested a change later with no disability funding.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
      assessmentConsolidatedData.appealsStudentDisabilityAppealData = {
        studentNewPDPPDStatus: "no",
      };

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.calculatedDataPDPPDStatus).toBe(
        false,
      );
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
