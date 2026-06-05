import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-room-and-board.`, () => {
  it("Should not calculate a room and board amount when student does not have a room and board appeal.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsRoomAndBoardCostsAppealData = undefined;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student does not have a room and board appeal, so the total room and board amount should be $0.
    expect(
      calculatedAssessment.variables.calculatedDataTotalRoomAndBoardAmount,
    ).toBe(undefined);
    // The standard living allowance for a single, independent student living away from home in BC is $541 per week.
    // For a 16-week offering, the total living allowance would be: 16 weeks * $541 = $8656.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(8656);
  });

  it("Should calculate the room and board amount based on the monthly value submitted when the student declares less than the maximum.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsRoomAndBoardCostsAppealData = {
      roomAndBoardAmount: 1400,
    };

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student has declared a room and board amount of $1400 per month. The maximum is $1420.
    // For a 16-week offering, the total room and board amount would be: 16 weeks * $1400/4.3 = $5209.
    expect(
      calculatedAssessment.variables.calculatedDataTotalRoomAndBoardAmount,
    ).toBe(5209);
    // The standard living allowance for a single, independent student living away from home in BC is $541 per week.
    // For a 16-week offering, the total living allowance would be: 16 weeks * $541 = $8656.
    // The room and board amount is included in the living allowance calculation.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(8656 + 5209);
  });

  it("Should calculate the room and board amount based on the maximum when the student declares more than the maximum.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsRoomAndBoardCostsAppealData = {
      roomAndBoardAmount: 3000,
    };

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student has declared a room and board amount of $3000 per month. The maximum is $1420.
    // For a 16-week offering, the total room and board amount would be: 16 weeks * $1420/4.3 = $5284.
    expect(
      calculatedAssessment.variables.calculatedDataTotalRoomAndBoardAmount,
    ).toBe(5284);
    // The standard living allowance for a single, independent student living away from home in BC is $541 per week.
    // For a 16-week offering, the total living allowance would be: 16 weeks * $541 = $8656.
    // The room and board amount is included in the living allowance calculation.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(5284 + 8656);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
