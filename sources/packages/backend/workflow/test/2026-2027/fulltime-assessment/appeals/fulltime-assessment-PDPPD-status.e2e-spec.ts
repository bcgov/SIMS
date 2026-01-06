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

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
