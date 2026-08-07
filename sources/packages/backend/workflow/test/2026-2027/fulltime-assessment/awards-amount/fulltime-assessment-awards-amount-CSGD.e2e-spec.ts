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
  it.only("Should set the CSGD amount at a minimum amount of 100 when the calculated amount is greater than 0 but lesser than 100.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 8;
    // Set the value close to the limit of the limitAwardCSGFThresholdIncome for a family size of 1 for.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 98017;
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
    // Ensure federalAwardNetCSGDAmount is between 0 and 100.
    expect(
      calculatedAssessment.variables.federalAwardNetCSGDAmount,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGDAmount,
    ).toBeLessThan(100);
    // Ensure finalFederalAwardNetCSGDAmount is set to 100.
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      100,
    );
  });

  it("Should not set the CSGD amount at a minimum amount of 100 when the calculated amount is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 16;
    // Set the value as the limit of the limitAwardCSGFThresholdIncome for a family size of 1 for.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 69987;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(0);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      0,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
