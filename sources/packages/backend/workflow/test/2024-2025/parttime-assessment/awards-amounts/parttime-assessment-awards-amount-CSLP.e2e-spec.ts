import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { AssessmentConsolidatedData } from "workflow/test/models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSLP.`, () => {
  let assessmentConsolidatedData: AssessmentConsolidatedData;

  beforeAll(async () => {
    assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 2000;

  });

  it("Should determine federalAwardCSLPAmount dmnPartTimeAwardAllowableLimits.limitAwardCSLPAmount when the student has does not have loan balance and there is a calculatedDataTotalRemainingNeed4", async () => {
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits.limitAwardCSLPAmount,
    ).toBe(10000);
    expect(calculatedAssessment.variables.limitAwardCSLPRemaining).toBe(10000);
    expect(calculatedAssessment.variables.latestCSLPBalance).toBe(0);
    expect(calculatedAssessment.variables.calculatedDataTotalRemainingNeed4).toBe(22858);
    expect(calculatedAssessment.variables.federalAwardNetCSLPAmount).toBe(10000);
  });

  it("Should determine federalAwardCSLPAmount to be difference of latestCSLPBalance and dmnPartTimeAwardAllowableLimits.limitAwardCSLPAmount when the student has loan balance and there is a calculatedDataTotalRemainingNeed4", async () => {
    // Arrange
    //Set latestCSLPBalance for the student as 1000.
    assessmentConsolidatedData.latestCSLPBalance = 1000;
    
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits.limitAwardCSLPAmount,
    ).toBe(10000);
    expect(calculatedAssessment.variables.limitAwardCSLPRemaining).toBe(9000);
    expect(calculatedAssessment.variables.latestCSLPBalance).toBe(1000);
    expect(calculatedAssessment.variables.calculatedDataTotalRemainingNeed4).toBe(22858);
    expect(calculatedAssessment.variables.federalAwardNetCSLPAmount).toBe(9000);
  });
});
