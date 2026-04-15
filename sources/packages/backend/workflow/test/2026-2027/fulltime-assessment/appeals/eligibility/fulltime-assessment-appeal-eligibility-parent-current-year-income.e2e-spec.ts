import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { DependantStatusType } from "workflow/test/models";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-parent-current-year-income.`, () => {
  const appealEligibilityScenarios = [
    {
      dependantStatus: "dependant",
      expectedEligibility: true,
    },
    {
      dependantStatus: "independant",
      expectedEligibility: false,
    },
  ];
  for (const {
    dependantStatus,
    expectedEligibility,
  } of appealEligibilityScenarios) {
    it(`Should evaluate the parent current year income appeal as ${expectedEligibility ? "eligible" : "not eligible"} when the student is ${dependantStatus}.`, async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependantstatus =
        dependantStatus as DependantStatusType;
      // Need for dependant students
      if (dependantStatus === "dependant") {
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
      }

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables
          .isEligibleForParentCurrentYearIncomeAppeal,
      ).toBe(expectedEligibility);
    });
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
