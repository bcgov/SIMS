import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentChildCareEligibility,
  DependentEligibility,
  createFakeStudentDependentEligible,
  createFakeStudentDependentEligibleForChildcareCost,
  createFakeStudentDependentNotEligible,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGD.`, () => {
  it("Should determine CSGD as eligible when financial need is at least $1 and total family income is under the threshold and there is at least 1 eligible dependent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 32999;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Creates 4 eligible childcare (CSGD) dependants, 2 family-size eligible dependants, 1 fully ineligible dependant.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible12YearsAndOver,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible12YearsAndOver,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.EligibleOver22YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome must be below the threshold for
    // dmnFullTimeAwardFamilySizeVariables.limitAwardCSGDThresholdIncome.
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    // Family size is calculated as the number of eligible dependants (6) plus the student.
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(7);
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildcareDependants,
    ).toBe(4);
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGDAmount,
    ).toBeGreaterThan(0);
  });

  it("Should determine CSGD as not eligible when financial need is at least $1 and total family income is above the threshold and there is at least 1 eligible dependent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is above the threshold to force it to fail.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 100000;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(0);
  });

  it("Should determine CSGD as not eligible when financial need is at least $1 and total family income is below the threshold and eligible dependents is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is below any threshold to force enforce the "at least one eligible dependants" rule to fail.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 1000;
    // Eligible dependants for family size include dependants 18-22 attending post-secondary school.
    // Dependants eligible for CSGD must be either 0-11 years old or 12+ with a disability.
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
