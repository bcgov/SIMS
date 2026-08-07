import { CredentialType, ProgramLengthOptions } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-awards-amount-CSGF.`, () => {
  it("Should cap CSGF at 6300 when offering weeks exceed the annual cap threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 60;
    assessmentConsolidatedData.studentDataTaxReturnIncome = 0;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(true);
    expect(calculatedAssessment.variables.federalAwardNetCSGFAmount).toBe(6300);
  });

  it("Should set the CSGF amount at a minimum amount of 100 when the calculated amount is greater than 0 but lesser than 100.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 16;
    // Set the value close to the limit of the limitAwardCSGFThresholdIncome for a family size of 1 for.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 68320;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(true);
    // Ensure federalAwardNetCSGFAmount is between 0 and 100.
    expect(
      calculatedAssessment.variables.federalAwardNetCSGFAmount,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGFAmount,
    ).toBeLessThan(100);
    // Ensure finalFederalAwardNetCSGFAmount is set to 100.
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGFAmount).toBe(
      100,
    );
  });

  it("Should not set the CSGF amount at a minimum amount of 100 when the calculated amount is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.offeringWeeks = 16;
    // Set the value as the limit of the limitAwardCSGFThresholdIncome for a family size of 1 for.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 68325;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.federalAwardNetCSGFAmount).toBe(0);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGFAmount).toBe(
      0,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
