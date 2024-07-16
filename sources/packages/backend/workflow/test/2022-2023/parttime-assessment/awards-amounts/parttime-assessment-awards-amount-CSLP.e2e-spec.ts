import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { AssessmentConsolidatedData } from "workflow/test/models";

describe(`E2E Test Workflow part-time-assessment-${PROGRAM_YEAR}-awards-amount-CSLP.`, () => {
  let sharedAssessmentConsolidatedData: AssessmentConsolidatedData;

  beforeAll(async () => {
    sharedAssessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    sharedAssessmentConsolidatedData.studentDataCRAReportedIncome = 2000;
  });

  it("Should determine CSLP award for an assessment which involves loan and grants when the student does not have any loan balance and has remaining need for loan.", async () => {
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      sharedAssessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.limitAwardCSLPRemaining).toBe(10000);
    expect(calculatedAssessment.variables.latestCSLPBalance).toBe(0);
    expect(
      calculatedAssessment.variables.calculatedDataTotalRemainingNeed4,
    ).toBe(22751.57264);
    expect(calculatedAssessment.variables.federalAwardNetCSLPAmount).toBe(
      10000,
    );
    expect(calculatedAssessment.variables.finalFederalAwardNetCSLPAmount).toBe(
      10000,
    );
  });

  it("Should determine CSLP award for an assessment which involves loan and grants when the student have loan balance and has remaining need for loan.", async () => {
    // Arrange
    // Set latestCSLPBalance for the student as 1000.
    sharedAssessmentConsolidatedData.latestCSLPBalance = 1000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      sharedAssessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.limitAwardCSLPRemaining).toBe(9000);
    expect(calculatedAssessment.variables.latestCSLPBalance).toBe(1000);
    expect(
      calculatedAssessment.variables.calculatedDataTotalRemainingNeed4,
    ).toBe(22751.57264);
    expect(calculatedAssessment.variables.federalAwardNetCSLPAmount).toBe(9000);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSLPAmount).toBe(
      9000,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
