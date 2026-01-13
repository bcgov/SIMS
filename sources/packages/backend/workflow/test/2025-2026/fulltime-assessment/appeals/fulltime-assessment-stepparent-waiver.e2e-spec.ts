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
  it("Should not impact family size, total income, contribution or dependants when a dependant student does not have a step parent waiver appeal.", async () => {
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
    assessmentConsolidatedData.parent1SupportingUserId = 500;
    assessmentConsolidatedData.parent1TotalIncome = 80000;
    assessmentConsolidatedData.parent1CppEmployment = 5000;
    assessmentConsolidatedData.parent1Contributions = 250;
    assessmentConsolidatedData.parent1Ei = 1050;
    assessmentConsolidatedData.parent1Tax = 60;
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
    assessmentConsolidatedData.parent2SupportingUserId = 600;
    assessmentConsolidatedData.parent2TotalIncome = 70000;
    assessmentConsolidatedData.parent2CppEmployment = 5000;
    assessmentConsolidatedData.parent2Contributions = 300;
    assessmentConsolidatedData.parent2Ei = 2050;
    assessmentConsolidatedData.parent2Tax = 50;
    assessmentConsolidatedData.parent2CppSelfemploymentOther = 100;
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
    // Deductions
    expect(
      calculatedAssessment.variables.calculatedDataParent1IncomeDeductions,
    ).toBe(4977);
    expect(
      calculatedAssessment.variables.calculatedDataParent2IncomeDeductions,
    ).toBe(4967);
    // Parent 1 + Parent 2 deductions = 4977 + 4967 = 9944
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentDeductions,
    ).toBe(9944);
    // Net family income: $150000 - $9944 = $140056
    expect(
      calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
    ).toBe(140056);
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
    // Parental contribution calculation is the higher of: Student declared amount ($0), or the sum of both parents' declared amounts ($550).
    expect(
      calculatedAssessment.variables.calculatedDataParentalContribution,
    ).toBe(550);
  });

  it("Should reduce family size, total income, contribution and dependants when a student has a step parent waiver appeal for one parent (parent 1).", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStepParentWaiverAppealData = {
      selectedParent: 501,
    };
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
    assessmentConsolidatedData.studentDataParents = [
      { parentIsAbleToReport: YesNoOptions.Yes },
      { parentIsAbleToReport: YesNoOptions.Yes },
    ];
    // Parent 1 data
    assessmentConsolidatedData.parent1SupportingUserId = 501; // Parent with step parent waiver appeal
    assessmentConsolidatedData.parent1TotalIncome = 80000;
    assessmentConsolidatedData.parent1CppEmployment = 5000;
    assessmentConsolidatedData.parent1Contributions = 250;
    assessmentConsolidatedData.parent1Ei = 1050;
    assessmentConsolidatedData.parent1Tax = 60;
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
    assessmentConsolidatedData.parent2SupportingUserId = 601;
    assessmentConsolidatedData.parent2TotalIncome = 70000;
    assessmentConsolidatedData.parent2CppEmployment = 5000;
    assessmentConsolidatedData.parent2Contributions = 300;
    assessmentConsolidatedData.parent2Ei = 2050;
    assessmentConsolidatedData.parent2Tax = 50;
    assessmentConsolidatedData.parent2CppSelfemploymentOther = 100;
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
    // Verify that the step parent waiver appeal has been applied correctly.
    // Supporting user id 501 corresponds to parent 1.
    expect(calculatedAssessment.variables.calculatedDataWaivedParent).toBe(1);
    // Parent 2's income and dependants should only be used in the calculations.
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      70000,
    );
    // Deductions
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentDeductions,
    ).toBe(4967);
    // Net family income: $70000 - $4967 = $65033
    expect(
      calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
    ).toBe(65033);
    // Dependants
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalParentEligibleDependants,
    ).toBe(1); // Only parent 2's dependants are considered
    // Family size is student + parent + dependants = 1 + 1 + 1 = 3
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(3);
    // Parental contribution calculation is the higher of: Student declared amount ($0), or the sum of both parents' declared amounts ($550).
    expect(
      calculatedAssessment.variables.calculatedDataParentalContribution,
    ).toBe(300);
  });

  it("Should reduce family size, total income, contribution and dependants when a student has a step parent waiver appeal for one parent (parent 2).", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.appealsStepParentWaiverAppealData = {
      selectedParent: 602,
    };
    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
    assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
    assessmentConsolidatedData.studentDataParents = [
      { parentIsAbleToReport: YesNoOptions.Yes },
      { parentIsAbleToReport: YesNoOptions.Yes },
    ];
    // Parent 1 data
    assessmentConsolidatedData.parent1SupportingUserId = 502;
    assessmentConsolidatedData.parent1TotalIncome = 80000;
    assessmentConsolidatedData.parent1CppEmployment = 5000;
    assessmentConsolidatedData.parent1Contributions = 250;
    assessmentConsolidatedData.parent1Ei = 1050;
    assessmentConsolidatedData.parent1Tax = 60;
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
    assessmentConsolidatedData.parent2SupportingUserId = 602; // Parent with step parent waiver appeal
    assessmentConsolidatedData.parent2TotalIncome = 70000;
    assessmentConsolidatedData.parent2CppEmployment = 5000;
    assessmentConsolidatedData.parent2Contributions = 300;
    assessmentConsolidatedData.parent2Ei = 2050;
    assessmentConsolidatedData.parent2Tax = 50;
    assessmentConsolidatedData.parent2CppSelfemploymentOther = 100;
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
    // Verify that the step parent waiver appeal has been applied correctly.
    // Supporting user id 602 corresponds to parent 2.
    expect(calculatedAssessment.variables.calculatedDataWaivedParent).toBe(2);

    // Parent 2's income and dependants should only be used in the calculations.
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      80000,
    );
    // Deductions
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentDeductions,
    ).toBe(4977);
    // Net family income: $80000 - $4977 = $75023
    expect(
      calculatedAssessment.variables.calculatedDataTotalNetFamilyIncome,
    ).toBe(75023);
    // Dependants
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalParentEligibleDependants,
    ).toBe(2); // Only parent 1's dependants are considered
    // Family size is student + parent + dependants = 1 + 1 + 2 = 4
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(4);
    // Parental contribution calculation is the higher of: Student declared amount ($0), or the sum of both parents' declared amounts ($550).
    expect(
      calculatedAssessment.variables.calculatedDataParentalContribution,
    ).toBe(250);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
