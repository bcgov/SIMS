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
    assessmentConsolidatedData.appealsRoomAndBoardCostsAppealData = null;

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
    // The standard living allowance for a single, independent student living away from home in BC is $563 per week.
    // For a 16-week offering, the total living allowance would be: 16 weeks * $563 = $9,008.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(9008);
  });

  it("Should calculate the room and board amount based on the monthly value submitted when the student declares less than the maximum.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsRoomAndBoardCostsAppealData = {
      roomAndBoardAmount: 1530,
    };

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student has declared a room and board amount of $1530 per month. The maximum is $1535.
    // For a 16-week offering, the total room and board amount would be: 16 weeks * $1530/4.3 = $5693.
    expect(
      calculatedAssessment.variables.calculatedDataTotalRoomAndBoardAmount,
    ).toBe(5693);
    // The standard living allowance for a single, independent student living away from home in BC is $563 per week.
    // For a 16-week offering, the total living allowance would be: 16 weeks * $563 = $9,008.
    // The room and board amount is included in the living allowance calculation.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(14701);
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
    // The student has declared a room and board amount of $3000 per month. The maximum is $1535.
    // For a 16-week offering, the total room and board amount would be: 16 weeks * $1535/4.3 = $5712.
    expect(
      calculatedAssessment.variables.calculatedDataTotalRoomAndBoardAmount,
    ).toBe(5712);
    // The standard living allowance for a single, independent student living away from home in BC is $563 per week.
    // For a 16-week offering, the total living allowance would be: 16 weeks * $563 = $9,008.
    // The room and board amount is included in the living allowance calculation.
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(14720);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
