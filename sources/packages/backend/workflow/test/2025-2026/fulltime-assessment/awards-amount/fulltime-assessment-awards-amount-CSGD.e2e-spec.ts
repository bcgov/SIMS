import { CredentialType, ProgramLengthOptions } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  createFakeStudentDependentEligibleForChildcareCost,
  DependentChildCareEligibility,
} from "../../../test-utils/factories";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-awards-amount-CSGD.`, () => {
  it("Should determine the correct amount when the student is eligible for the award.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 8;
    assessmentConsolidatedData.studentDataTaxReturnIncome = 10000;
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
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(true);
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(517);
  });

  it("Should set the amount at a minimum amount of 100 when award is eligible.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 8;
    // Set the value close to the limit of the limitAwardCSGFThresholdIncome for a family size of 1 for.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 96000;
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
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(true);
    // Ensure federalAwardNetCSGDAmount is less than 100.
    expect(calculatedAssessment.variables.federalAwardCSGDAmount).toBeLessThan(
      100,
    );
    // Ensure federalAwardNetCSGDAmount is set to 100.
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(100);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
