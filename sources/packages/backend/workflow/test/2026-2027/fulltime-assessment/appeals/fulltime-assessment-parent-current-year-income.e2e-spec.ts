import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-parent-current-year-income.`, () => {
  it("Should use application values when there is no partner current year income appeal and no CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.appealsPartnerIncomeAppealData = undefined;
    assessmentConsolidatedData.studentDataParents = [
      {
      ]
    assessmentConsolidatedData.parent1TotalIncome = 40000;
    assessmentConsolidatedData.parent2TotalIncome = 60000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataParent1TotalIncome,
    ).toBe(40000);
    expect(
      calculatedAssessment.variables.calculatedDataParent2TotalIncome,
    ).toBe(60000);
  });

  it("Should use CRA values when there is no partner current year income appeal and CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.appealsPartnerIncomeAppealData = undefined;
    assessmentConsolidatedData.parent1CRAReportedIncome = 35000;
    assessmentConsolidatedData.parent2CRAReportedIncome = 55000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataParent1TotalIncome,
    ).toBe(35000);
    expect(
      calculatedAssessment.variables.calculatedDataParent2TotalIncome,
    ).toBe(55000);
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
    assessmentConsolidatedData.partner1CRAReportedIncome = undefined;

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
