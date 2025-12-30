import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-room-and-board-costs.`, () => {
  it("Should evaluate the room and board costs appeal as eligible when the student entered as paying rent to their parent(s) in the application.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // The student data variable that indicates the student is paying rent to their parent(s).
    assessmentConsolidatedData.studentDataLivingAtHomeRent = YesNoOptions.Yes;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.isEligibleForRoomAndBoardAppeal).toBe(
      true,
    );
  });

  it("Should evaluate the room and board costs appeal as not eligible when the student entered as not paying rent to their parent(s) in the application.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // The student data variable that indicates the student is not paying rent to their parent(s).
    assessmentConsolidatedData.studentDataLivingAtHomeRent = YesNoOptions.No;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.isEligibleForRoomAndBoardAppeal).toBe(
      false,
    );
  });

  it("Should evaluate the room and board costs appeal as not eligible when the student entered a living situation which is not applicable to pay rent to their parent(s).", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // The input states that the student is not living at home paid for by parent(s).
    assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.No;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.isEligibleForRoomAndBoardAppeal).toBe(
      false,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
