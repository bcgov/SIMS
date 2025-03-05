import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
  createFakeStudentDependentNotEligible,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGD.`, () => {
  it("Should determine CSGD as eligible when financial need is at least $1 and total family income is under the threshold and there is at least 1 eligible dependent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 32999;
    // Creates 4 eligible and 4 not eligible dependents.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.EligibleOver22YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
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
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(5);
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
      createFakeStudentDependentEligible(
        DependentEligibility.EligibleOver22YearsOld,
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

  it("Should determine CSGD as not eligible when financial need is at least $1 and total family income is below the threshold and eligible dependents is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is below any threshold to force enforce the "at least one eligible dependants" rule to fail.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 1000;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible0To18YearsOld,
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
