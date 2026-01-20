import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-total-parent-income.`, () => {
  it(
    "Should calculate total gross family income (1 Parent) as the declared value when CRA or current year income are not provided " +
      "and the deductions are more than the maximum for the year " +
      "and the one parent is able to report their financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1TotalIncome = 65000;
      assessmentConsolidatedData.parent1CppEmployment = 3000;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 3000;
      assessmentConsolidatedData.parent1Ei = 1200;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
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
      // Calculated total parent income must be consistent with the parent total income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentIncome,
      ).toBe(65000);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP ($3868) and EI ($1049) are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentDeductions,
      ).toBe(5617);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(65000);
      // Calculated total net family income should be the gross parent income minus the deductions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(59383);
    },
  );

  it(
    "Should calculate total gross family income (1 Parent) as the declared value when CRA or current year income are not provided " +
      "and the deductions are less than the maximum for the year " +
      "and the one parent is able to report their financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
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
      // Calculated total parent income must be consistent with the parent total income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentIncome,
      ).toBe(99999);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP and EI are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentDeductions,
      ).toBe(2000);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(99999);
      // Calculated total net family income should be the gross parent income minus the deductions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(97999);
    },
  );

  it(
    "Should calculate total gross family income (1 Parent) as the CRA income value when present " +
      "and the deductions are less than the maximum for the year " +
      "and the one parent is able to report their financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1CRAReportedIncome = 50000;
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
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
        calculatedAssessment.variables.calculatedDataTotalParentDeductions,
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
    "Should calculate total gross and net family income (1 parent) as the current year income value when present " +
      "and the parent is able to report their financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1CRAReportedIncome = 50000;
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
          parentIsAbleToReport: YesNoOptions.Yes,
          currentYearParentIncome: 12000,
        },
      ];

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
      ).toBe(12000);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP and EI are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentDeductions,
      ).toBe(1058);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(12000);
      // Calculated total net family income should be the gross parent income minus the deductions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(10942);
    },
  );

  it(
    "Should calculate total gross and net family income (2 parents) as the current year income value when present for parent 2 " +
      "and both parents are able to report their financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1CRAReportedIncome = 50000;
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.parent2CRAReportedIncome = 40000;
      assessmentConsolidatedData.parent2TotalIncome = 99999;
      assessmentConsolidatedData.parent2CppEmployment = 500;
      assessmentConsolidatedData.parent2CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent2Ei = 600;
      assessmentConsolidatedData.parent2Tax = 700;
      assessmentConsolidatedData.parent2Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
          parentIsAbleToReport: YesNoOptions.Yes,
        },
        {
          parentIsAbleToReport: YesNoOptions.Yes,
          currentYearParentIncome: 12000,
        },
      ];

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
      ).toBe(62000);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP and EI are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataParent1IncomeDeductions,
      ).toBe(2000);
      expect(
        calculatedAssessment.variables.calculatedDataParent2IncomeDeductions,
      ).toBe(1058.4);
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentDeductions,
      ).toBe(3058);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(62000);
      // Calculated total net family income should be the gross parent income minus the deductions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(62000 - 3058);
    },
  );

  it(
    "Should calculate total gross family income (2 Parent) as the declared value when CRA or current year income are not provided " +
      "and the deductions are less than the maximum for the year " +
      "and both parents are able to report their financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.parent2TotalIncome = 99999;
      assessmentConsolidatedData.parent2CppEmployment = 500;
      assessmentConsolidatedData.parent2CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent2Ei = 600;
      assessmentConsolidatedData.parent2Tax = 700;
      assessmentConsolidatedData.parent2Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
          parentIsAbleToReport: YesNoOptions.Yes,
        },
        {
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
      // Calculated total parent income must be consistent with the parent total income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentIncome,
      ).toBe(199998);
      // Calculated total parent deductions must combine total CPP, EI and Income Tax.
      // The deductions for CPP and EI are capped at the maximum for the year.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentDeductions,
      ).toBe(4000);
      // Calculated total family income should be the gross parent income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(199998);
      // Calculated total net family income should be the gross parent income minus the deductions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
      ).toBe(195998);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
