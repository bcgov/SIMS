import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-total-partner-income.`, () => {
  it("Should calculate total partner income as the CRA verified income value when the student is married and the partner had CRA verified income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1CRAReportedIncome = 30000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Calculated total partner income must be 30000.
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(30000);
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome +
        calculatedAssessment.variables.calculatedDataStudentTotalIncome,
    );
  });

  it(
    "Should calculate total partner income as self reported partner's tax return income when the student is married and" +
      " their partner did not have CRA verified income.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.partner1TotalIncome = 15000;
      // No income verification happened as student self reported partner's tax return income.
      assessmentConsolidatedData.partner1CRAReportedIncome = null;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Calculated total partner income must be 30000.
      expect(
        calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
      ).toBe(15000);
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(
        calculatedAssessment.variables.calculatedDataPartner1TotalIncome +
          calculatedAssessment.variables.calculatedDataStudentTotalIncome,
      );
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
