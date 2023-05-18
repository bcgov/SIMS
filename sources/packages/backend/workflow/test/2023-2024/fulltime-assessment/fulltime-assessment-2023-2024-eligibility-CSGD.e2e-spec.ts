import {
  createFakeConsolidatedFulltimeData,
  executeFulltimeAssessmentForProgramYear,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
  createFakeStudentDependentNotEligible,
} from "../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGD`, () => {
  it("Should determine CSGD (federal and provincial) as eligible when financial need is at least $1 and total family income is under the threshold and eligible dependents are greater than 1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 32999;
    // Creates 4 eligible and 4 not eligible dependents.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.EligibleOver22YearsOld,
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.EligibleOver22YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFulltimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome must be below the threshold for
    // dmnFullTimeAwardFamilySizeVariables.limitAwardCSGDThresholdIncome.
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(5);
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGDAmount,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.provincialAwardNetCSGDAmount,
    ).toBeGreaterThan(0);
  });

  it("Should determine CSGD (federal and provincial) as not eligible when financial need is at least $1 and total family income is above the threshold and eligible dependents are greater than 1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 100000;
    // Creates one eligible dependent (between 0-18 years old condition).
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFulltimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
  });

  it("Should determine CSGD (federal and provincial) as not eligible when financial need is at least $1 and total family income is above the threshold and eligible dependents is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 32999;
    // Not eligible dependent because he is over 22 and no declared on taxes.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFulltimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
  });
});
