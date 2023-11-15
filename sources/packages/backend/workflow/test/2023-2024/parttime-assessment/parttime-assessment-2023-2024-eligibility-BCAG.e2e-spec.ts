import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executeAssessment,
} from "../../test-utils";
import { CredentialType, InstitutionTypes } from "../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-BCAG.`, () => {
  // Expected and not expected credentials types.
  const EXPECTED_PROGRAM_CREDENTIAL_TYPES = [
    CredentialType.UnderGraduateDegree,
    CredentialType.GraduateCertificate,
    CredentialType.GraduateDiploma,
    CredentialType.QualifyingStudies,
  ];

  describe(
    "Should determine BCAG as eligible when total assessed need is greater than or equal to 1 " +
      `, institution type is ${InstitutionTypes.BCPublic}, total family income is less than the threshold and`,
    () => {
      for (const programCredentialType of EXPECTED_PROGRAM_CREDENTIAL_TYPES) {
        it(`programCredentialType is ${programCredentialType}`, async () => {
          // Arrange
          // By default createFakeConsolidatedPartTimeData has total assessed need is greater 1.
          const assessmentConsolidatedData =
            createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
          assessmentConsolidatedData.institutionType =
            InstitutionTypes.BCPublic;
          assessmentConsolidatedData.programCredentialType =
            programCredentialType;

          // Act
          const calculatedAssessment = await executeAssessment(
            `parttime-assessment-${PROGRAM_YEAR}`,
            assessmentConsolidatedData,
          );

          // Assert
          expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(
            true,
          );
          expect(
            calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
          ).toBeGreaterThan(0);
        });
      }
    },
  );

  it(`Should determine BCAG as not eligible when institution type is ${InstitutionTypes.BCPrivate}.`, async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.institutionType = InstitutionTypes.BCPrivate;

    // Act
    const calculatedAssessment = await executeAssessment(
      `parttime-assessment-${PROGRAM_YEAR}`,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
    ).toBe(0);
  });

  it(`Should determine BCAG as not eligible when program credential type is ${CredentialType.GraduateDegreeOrMasters}.`, async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.GraduateDegreeOrMasters;

    // Act
    const calculatedAssessment = await executeAssessment(
      `parttime-assessment-${PROGRAM_YEAR}`,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
    ).toBe(0);
  });
});
