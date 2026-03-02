import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-exceptional-expense.`, () => {
  it("Should not calculate an exceptional expense amount when student does not have an exceptional expense appeal.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsExceptionalExpenseAppealData = null;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student does not have an exceptional expense appeal, so the exceptional expense amount should be $0.
    expect(calculatedAssessment.variables.calculatedDataExceptionalCosts).toBe(
      0,
    );
  });

  it("Should calculate the exceptional expense amount based on the appeal amount submitted.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsExceptionalExpenseAppealData = {
      exceptionalExpenseAmount: 1530,
    };

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student has declared an exceptional expense amount of $1530.
    expect(calculatedAssessment.variables.calculatedDataExceptionalCosts).toBe(
      1530,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
