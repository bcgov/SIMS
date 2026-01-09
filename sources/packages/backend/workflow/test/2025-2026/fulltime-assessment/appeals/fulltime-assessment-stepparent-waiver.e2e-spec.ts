import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  createFakeStudentDependentEligible,
  DependentEligibility,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-stepparent-waiver.`, () => {
  it("Should not impact family size, total income or dependants when a dependant student does not have a room and board appeal.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStepParentWaiverAppealData = null;
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
    assessmentConsolidatedData.studentDataParents = [
      { parentIsAbleToReport: YesNoOptions.Yes },
      { parentIsAbleToReport: YesNoOptions.Yes },
    ];
    // Parent 1 data
    assessmentConsolidatedData.parent1TotalIncome = 80000;
    assessmentConsolidatedData.parent1CppEmployment = 5000;
    assessmentConsolidatedData.parent1Contributions = 2500;
    assessmentConsolidatedData.parent1Ei = 0;
    assessmentConsolidatedData.parent1Tax = 0;
    assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
    assessmentConsolidatedData.parent1NetAssests = 300000;
    assessmentConsolidatedData.parent1DependentTable = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    //Parent 2 data
    assessmentConsolidatedData.parent2TotalIncome = 70000;
    assessmentConsolidatedData.parent2CppEmployment = 5000;
    assessmentConsolidatedData.parent2Contributions = 2500;
    assessmentConsolidatedData.parent2Ei = 0;
    assessmentConsolidatedData.parent2Tax = 0;
    assessmentConsolidatedData.parent2CppSelfemploymentOther = 200;
    assessmentConsolidatedData.parent2NetAssests = 300000;
    assessmentConsolidatedData.parent2DependentTable = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    // The student does not have a step parent waiver appeal, so there should be no changes to family size, total family income, or dependants (of the parents).
    // Total family income is the sum of both parents' total income.
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      150000,
    );
    // Deductions total $15000 per parent but are partially capped based on annual cpp and ei limits.
    expect(
      calculatedAssessment.variables.calculatedDataParent1IncomeDeductions,
    ).toBe(3868);
    expect(
      calculatedAssessment.variables.calculatedDataParent2IncomeDeductions,
    ).toBe(3868);
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentDeductions,
    ).toBe(7736);
    // Net family income: $150000 - $7736 = $142264
    expect(
      calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
    ).toBe(142264);
    // Dependants
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalEligibleParent1Dependants,
    ).toBe(2);
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalEligibleParent2Dependants,
    ).toBe(1);
    // We take the maximum of both parents' dependants to calculate total parent dependants (only one should report)
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalParentEligibleDependants,
    ).toBe(2);
    // Family size is student + parents + dependants = 1 + 2 + 2 = 5
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(5);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
