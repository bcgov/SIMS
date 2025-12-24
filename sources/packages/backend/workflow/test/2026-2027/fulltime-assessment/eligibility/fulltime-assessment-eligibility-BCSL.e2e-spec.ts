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
import { YesNoOptions } from "@sims/test-utils";

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
    assessmentConsolidatedData.studentDataTaxReturnIncome = 500000;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataProvincialAssessedNeed,
    ).toBeLessThan(1);
    expect(calculatedAssessment.variables.awardEligibilityBCSL).toBe(false);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCSLAmount,
    ).toBe(0);
  });

  it("Should determine BC(SL) Top Up as eligible when eligible dependants is greater than 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Eligible dependants include dependants 18-22 attending post-secondary school, 0-18 years old and >22 if declared on taxes.
    assessmentConsolidatedData.studentDataDependants = [
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
    expect(
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(1);
    expect(calculatedAssessment.variables.awardEligibilityBCTopUp).toBe(true);
  });

  it("Should determine BC(SL) Top Up as not eligible when eligible dependants is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Eligible dependants include dependants 18-22 attending post-secondary school, 0-18 years old and >22 if declared on taxes.
    assessmentConsolidatedData.studentDataDependants = [
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
    expect(
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(0);
    expect(calculatedAssessment.variables.awardEligibilityBCTopUp).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
