import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-BCSL.`, () => {
  it("Should determine BCSL as eligible when provincial need is at least $1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataProvincialAssessedNeed,
    ).toBeGreaterThan(0);
    expect(calculatedAssessment.variables.awardEligibilityBCSL).toBe(true);
  });

  it("Should determine BCSL as not eligible when provincial need is less than $1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is high enough to eliminate any provincial need.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 150000;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCSL).toBe(false);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCSLAmount,
    ).toBe(0);
  });

  it("Should determine CSGD as not eligible when financial need is at least $1 and total family income is below the threshold and eligible dependents is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is below any threshold to force enforce the "at least one eligible dependants" rule to fail.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 1000;
    // Eligible dependants for family size include dependants 18-22 attending post-secondary school.
    // Dependants eligible for CSGD must be either 0-11 years old or 12+ with a disability.
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
