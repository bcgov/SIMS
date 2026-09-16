import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { DependantStatusType } from "../../../../models";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-student-current-year-income.`, () => {
  const appealEligibilityScenarios = [
    {
      dependantStatus: "dependant",
      expectedEligibility: false,
      inputData: {
        parent1TotalIncome: 99999,
        parent1CppEmployment: 500,
        parent1CppSelfemploymentOther: 200,
        parent1Ei: 600,
        parent1Tax: 700,
        parent1Contributions: 0,
        studentDataVoluntaryContributions: 0,
        studentDataParents: [
          {
            parentIsAbleToReport: YesNoOptions.Yes,
          },
        ],
      },
    },
    {
      dependantStatus: "independant",
      expectedEligibility: true,
    },
  ];
  for (const {
    dependantStatus,
    expectedEligibility,
    inputData,
  } of appealEligibilityScenarios) {
    it(`Should evaluate the student current year income appeal as ${expectedEligibility ? "eligible" : "not eligible"} when the student is ${dependantStatus}.`, async () => {
      // Arrange
      const assessmentConsolidatedData = {
        ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
        ...inputData,
      };
      assessmentConsolidatedData.studentDataDependantstatus =
        dependantStatus as DependantStatusType;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables
          .isEligibleForStudentCurrentYearIncomeAppeal,
      ).toBe(expectedEligibility);
    });
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
