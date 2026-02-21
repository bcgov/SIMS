import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-partner-current-year-income.`, () => {
  it("Should use application values when there is no partner current year income appeal and no CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsPartnerCurrentYearIncomeAppealData = null;
    assessmentConsolidatedData.partner1TotalIncome = 1234;
    assessmentConsolidatedData.partner1CRAReportedIncome = null;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(1234);
  });

  it("Should use the appeal current year income values when there is a partner current year income appeal and the partner has no CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.appealsPartnerCurrentYearIncomeAppealData = {
      currentYearIncome: 20001,
    };
    assessmentConsolidatedData.partner1TotalIncome = 100002;
    assessmentConsolidatedData.partner1CRAReportedIncome = null;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(20001);
  });

  it("Should use the appeal current year income values when there is a partner current year income appeal and the partner has CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.appealsPartnerCurrentYearIncomeAppealData = {
      currentYearIncome: 20001,
    };
    assessmentConsolidatedData.partner1CRAReportedIncome = 1000001;
    assessmentConsolidatedData.partner1TotalIncome = 100002;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataPartner1TotalIncome,
    ).toBe(20001);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
