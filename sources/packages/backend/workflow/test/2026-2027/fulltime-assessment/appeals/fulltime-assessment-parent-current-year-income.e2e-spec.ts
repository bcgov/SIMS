import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-parent-current-year-income.`, () => {
  it("Should use application values for both parents when there is no parent current year income appeal and no CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataNumberOfParents = 2;
    assessmentConsolidatedData.studentDataParents = [
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
    ];

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

  it("Should use CRA values for both parents when there is no parent current year income appeal and CRA reported income.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataNumberOfParents = 2;
    assessmentConsolidatedData.studentDataParents = [
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
    ];
    assessmentConsolidatedData.parent1TotalIncome = 40000;
    assessmentConsolidatedData.parent2TotalIncome = 60000;
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

  it("Should use the appeal current year income values when there is a parent current year income appeal for parent 1 and CRA reported income for parent 2 .", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataNumberOfParents = 2;
    assessmentConsolidatedData.studentDataParents = [
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
    ];
    assessmentConsolidatedData.parent1TotalIncome = 40000;
    assessmentConsolidatedData.parent2TotalIncome = 60000;
    assessmentConsolidatedData.parent1CRAReportedIncome = 35000;
    assessmentConsolidatedData.parent2CRAReportedIncome = 55000;
    assessmentConsolidatedData.appealsParentCurrentYearIncomeAppealData = [
      {
        currentYearParentIncome: 5000,
      },
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataParent1TotalIncome,
    ).toBe(5000);
    expect(
      calculatedAssessment.variables.calculatedDataParent2TotalIncome,
    ).toBe(55000);
  });

  it("Should use the appeal current year income values for both parents when there is a parent current year income appeal for both parents.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataNumberOfParents = 2;
    assessmentConsolidatedData.studentDataParents = [
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
      {
        parentIsAbleToReport: YesNoOptions.Yes,
      },
    ];
    assessmentConsolidatedData.parent1TotalIncome = 40000;
    assessmentConsolidatedData.parent2TotalIncome = 60000;
    assessmentConsolidatedData.parent1CRAReportedIncome = 35000;
    assessmentConsolidatedData.parent2CRAReportedIncome = 55000;
    assessmentConsolidatedData.appealsParentCurrentYearIncomeAppealData = [
      {
        currentYearParentIncome: 5000,
      },
      {
        currentYearParentIncome: 6000,
      },
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataParent1TotalIncome,
    ).toBe(5000);
    expect(
      calculatedAssessment.variables.calculatedDataParent2TotalIncome,
    ).toBe(6000);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
