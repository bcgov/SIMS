import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-student-current-year-income.`, () => {
  it("Should use application values when there is no student current year income appeal.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStudentCurrentYearIncomeAppealData = null;
    assessmentConsolidatedData.studentDataTaxReturnIncome = 1234;
    assessmentConsolidatedData.studentDataCRAReportedIncome = null;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataStudentTotalIncome,
    ).toBe(1234);
  });

  it("Should use the appeal current year income values when there is a student current year income appeal.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStudentCurrentYearIncomeAppealData = {
      currentYearIncome: 20001,
    };
    assessmentConsolidatedData.studentDataTaxReturnIncome = 100002;
    assessmentConsolidatedData.studentDataCRAReportedIncome = null;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataStudentTotalIncome,
    ).toBe(20001);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
