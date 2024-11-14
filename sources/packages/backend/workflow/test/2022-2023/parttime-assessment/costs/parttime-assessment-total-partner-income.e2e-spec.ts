import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-total-partner-income.`, () => {
  it("Should calculate total partner income as the CRA verified income value when the student is married and the partner is able to report their financial information.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
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
    // As the student did not report the current year partner income, it must be null.
    expect(
      calculatedAssessment.variables.calculatedDataCurrentYearPartnerIncome,
    ).toBe(null);
  });

  it(
    "Should calculate total partner income as self reported partner's current year income when the student is married and need to self report the partner financial information" +
      " as their partner's current year income needs to be reported.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataCurrentYearPartnerIncome = 10000;

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
      ).toBe(10000);
      // As the student reported the current year partner income, it must be 10000.
      expect(
        calculatedAssessment.variables.calculatedDataCurrentYearPartnerIncome,
      ).toBe(10000);
    },
  );

  it(
    "Should calculate total partner income as self reported partner's tax return income when the student is married and need to self report the partner financial information" +
      " as their partner is not eligible for BC Services Card.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 15000;
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
      // As the student did not report the current year partner income, it must be null.
      expect(
        calculatedAssessment.variables.calculatedDataCurrentYearPartnerIncome,
      ).toBe(null);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
