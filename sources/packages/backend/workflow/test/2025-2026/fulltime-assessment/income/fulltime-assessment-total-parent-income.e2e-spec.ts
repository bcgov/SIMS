import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  createIdentifiableParentsData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-total-parent-income.`, () => {
  it(
    "Should calculate total gross and net parent income as the CRA verified income value when the student is dependant with one parent " +
      "and the parent is able to report their financial information with deductions less than the maximum for the year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.studentDataTaxReturnIncome = 5000;
      assessmentConsolidatedData.parent1CRAReportedIncome = 50000;
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfEmploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
          numberOfParents: 1,
          parentIsAbleToReport: YesNoOptions.Yes,
        },
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Calculated total parent income must be consistent with the CRA income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentIncome,
      ).toBe(50000);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP and EI are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataParent1IncomeDeductions,
      ).toBe(2000);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(50000);
      // Calculated total net family income should be the gross parent income minus the deductions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(48000);
    },
  );
  it(
    "Should calculate total gross and net parent income as the current year income value when present " +
      "and the student is dependant with one parent " +
      "and the parent is able to report their financial information with deductions less than the maximum for the year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      //assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.studentDataTaxReturnIncome = 5000;
      //assessmentConsolidatedData.parent1CRAReportedIncome = 50000;
      //assessmentConsolidatedData.parent1TotalIncome = 99999;
      //assessmentConsolidatedData.parent1CppEmployment = 500;
      //assessmentConsolidatedData.parent1CppSelfEmploymentOther = 200;
      //assessmentConsolidatedData.parent1Ei = 600;
      //assessmentConsolidatedData.parent1Tax = 700;
      //assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      createIdentifiableParentsData({
        numberOfParents: 1,
        currentYearIncome: true,
      });

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Calculated total parent income must be consistent with the current year income when present.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentIncome,
      ).toBe(100);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP and EI are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataParent1IncomeDeductions,
      ).toBe(3868);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(100);
      // Calculated total net family income should be the gross parent income minus the deductions only down to $0. $100 - $3868 = $0
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(0);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
