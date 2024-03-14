import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { CredentialType, InstitutionTypes } from "../../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-BCAG.`, () => {
  // Expected and not expected credentials types.
  const EXPECTED_PROGRAM_CREDENTIAL_TYPES = [
    CredentialType.UnderGraduateCertificate,
    CredentialType.UnderGraduateCitation,
    CredentialType.UnderGraduateDiploma,
    CredentialType.UnderGraduateDegree,
  ];
  const NOT_EXPECTED_PROGRAM_CREDENTIAL_TYPES = Object.values(
    CredentialType,
  ).filter((type) => !EXPECTED_PROGRAM_CREDENTIAL_TYPES.includes(type));
  // Expected and not expected institution types.
  const NOT_EXPECTED_INSTITUTION_TYPES = Object.values(InstitutionTypes).filter(
    (type) => type !== InstitutionTypes.BCPublic,
  );

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
          const calculatedAssessment =
            await executePartTimeAssessmentForProgramYear(
              PROGRAM_YEAR,
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

  describe("Should determine BCAG as not eligible when", () => {
    for (const institutionType of NOT_EXPECTED_INSTITUTION_TYPES) {
      it(`institution type is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.institutionType = institutionType;

        // Act
        const calculatedAssessment =
          await executePartTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
        expect(
          calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
        ).toBe(0);
      });
    }
  });

  describe("Should determine BCAG as not eligible when", () => {
    for (const programCredentialType of NOT_EXPECTED_PROGRAM_CREDENTIAL_TYPES) {
      it(`programCredentialType is ${programCredentialType}.`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.programCredentialType =
          programCredentialType;

        // Act
        const calculatedAssessment =
          await executePartTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
        expect(
          calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
        ).toBe(0);
      });
    }
  });
});
