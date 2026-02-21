import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-appeal-eligibility-partner-current-year-income.`, () => {
  it("Should evaluate the partner current year income appeal as eligible when the student is married.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1TotalIncome = 100002;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(true);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student is single and independant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student relationship status is other and independant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "other";
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student relationship status is unable to report and independant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "marriedUnable";
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student is dependant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);

    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
