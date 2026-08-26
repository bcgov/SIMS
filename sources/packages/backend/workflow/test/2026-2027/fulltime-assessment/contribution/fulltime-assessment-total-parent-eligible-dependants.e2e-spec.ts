import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { createFakeStudentDependentEligibleForContribution } from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-total-parent-eligible-dependants.`, () => {
  it("Should calculate total parent eligible contribution dependants when two parents are present and the first parent is declaring other dependents.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
    assessmentConsolidatedData.studentDataParents = [
      { parentIsAbleToReport: YesNoOptions.Yes },
      { parentIsAbleToReport: YesNoOptions.Yes },
    ];
    // Parent 1 has one eligible dependent.
    assessmentConsolidatedData.parent1TotalIncome = 99999;
    assessmentConsolidatedData.parent1CppEmployment = 500;
    assessmentConsolidatedData.parent1Ei = 600;
    assessmentConsolidatedData.parent1Tax = 700;
    assessmentConsolidatedData.parent1Contributions = 0;
    assessmentConsolidatedData.parent1DependentTable = [
      createFakeStudentDependentEligibleForContribution({
        referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
      }),
    ];
    // Parent 2 has no eligible dependents.
    assessmentConsolidatedData.parent2TotalIncome = 99999;
    assessmentConsolidatedData.parent2CppEmployment = 500;
    assessmentConsolidatedData.parent2Ei = 600;
    assessmentConsolidatedData.parent2Tax = 700;
    assessmentConsolidatedData.parent2Contributions = 0;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // Parent 1 has 1 eligible dependents, total eligible dependents is 2 (plus 1 is added in the workflow).
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalEligibleParent1ContributionDependants,
    ).toBe(2);

    // Parent 2 has eligible dependents, default to 1 when not provided.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalEligibleParent2ContributionDependants,
    ).toBe(1);
    // The final value must be the max between the two parents, which is 2.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalParentEligibleContributionDependants,
    ).toBe(2);
  });

  it("Should calculate total parent eligible contribution dependants when two parents are present and the second parent is declaring other dependents.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
    assessmentConsolidatedData.studentDataParents = [
      { parentIsAbleToReport: YesNoOptions.Yes },
      { parentIsAbleToReport: YesNoOptions.Yes },
    ];
    // Parent 1 has no declared dependents.
    assessmentConsolidatedData.parent1TotalIncome = 99999;
    assessmentConsolidatedData.parent1CppEmployment = 500;
    assessmentConsolidatedData.parent1Ei = 600;
    assessmentConsolidatedData.parent1Tax = 700;
    assessmentConsolidatedData.parent1Contributions = 0;
    // Parent 2 has two eligible dependents.
    assessmentConsolidatedData.parent2TotalIncome = 99999;
    assessmentConsolidatedData.parent2CppEmployment = 500;
    assessmentConsolidatedData.parent2Ei = 600;
    assessmentConsolidatedData.parent2Tax = 700;
    assessmentConsolidatedData.parent2Contributions = 0;
    assessmentConsolidatedData.parent2DependentTable = [
      createFakeStudentDependentEligibleForContribution({
        referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
      }),
      createFakeStudentDependentEligibleForContribution({
        referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
      }),
    ];

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // Parent 1 has no eligible dependents, default to 1 when not provided.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalEligibleParent1ContributionDependants,
    ).toBe(1);
    // Parent 2 has 2 eligible dependents, total eligible dependents is 3 (plus 1 is added in the workflow).
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalEligibleParent2ContributionDependants,
    ).toBe(3);
    // The final value must be the max between the two parents, which is 3.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalParentEligibleContributionDependants,
    ).toBe(3);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
