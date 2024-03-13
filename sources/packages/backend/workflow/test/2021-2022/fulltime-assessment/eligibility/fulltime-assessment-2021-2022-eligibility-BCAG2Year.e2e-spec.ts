import {
  CredentialType,
  InstitutionTypes,
  ProgramLengthOptions,
} from "../../../models";
import {
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

/**
 * BCAG2Year is a variation for BCAG due to differences in the way that federalAwardBCAGWeeklyProratedMaximumGrant
 * is calculated where dmnFullTimeAwardFederalAllowableLimits defines different values for BCAG and BCAG2Year
 * where both will result in the BCAG calculation.
 * These tests are only intended to check the BCAG2Year eligibility.
 */
describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-BCAG2Year.`, () => {
  // Expected and not expected credentials types.
  const EXPECTED_PROGRAM_CREDENTIAL_TYPES = [
    CredentialType.UnderGraduateCertificate,
    CredentialType.UnderGraduateCitation,
    CredentialType.UnderGraduateDiploma,
    CredentialType.UnderGraduateDegree,
    CredentialType.GraduateCertificate,
    CredentialType.GraduateDiploma,
    CredentialType.QualifyingStudies,
  ];
  const NOT_EXPECTED_PROGRAM_CREDENTIAL_TYPES = Object.values(
    CredentialType,
  ).filter((type) => !EXPECTED_PROGRAM_CREDENTIAL_TYPES.includes(type));
  // Expected and not expected program length options.
  const EXPECTED_PROGRAM_LENGTH = [
    ProgramLengthOptions.SixtyWeeksToTwoYears,
    ProgramLengthOptions.TwoToThreeYears,
    ProgramLengthOptions.ThreeToFourYears,
    ProgramLengthOptions.FourToFiveYears,
    ProgramLengthOptions.FiveOrMoreYears,
  ];
  const NOT_EXPECTED_PROGRAM_LENGTH = Object.values(
    ProgramLengthOptions,
  ).filter((type) => !EXPECTED_PROGRAM_LENGTH.includes(type));

  describe("Should determine BCAG2Year as eligible when programCredentialType and programLength are the expected ones and institution is BC Public and financial need is at least $1.", () => {
    for (const programCredentialType of EXPECTED_PROGRAM_CREDENTIAL_TYPES) {
      for (const programLength of EXPECTED_PROGRAM_LENGTH) {
        it(`programCredentialType is ${programCredentialType} and programLength is ${programLength}`, async () => {
          // Arrange
          const assessmentConsolidatedData =
            createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
          assessmentConsolidatedData.programCredentialType =
            programCredentialType;
          assessmentConsolidatedData.programLength = programLength;
          // Act
          const calculatedAssessment =
            await executeFullTimeAssessmentForProgramYear(
              PROGRAM_YEAR,
              assessmentConsolidatedData,
            );
          // Assert
          expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(
            true,
          );
        });
      }
    }
  });

  describe("Should determine BCAG2Year as not eligible when programCredentialType and programLength are not the expected ones.", () => {
    for (const programCredentialType of NOT_EXPECTED_PROGRAM_CREDENTIAL_TYPES) {
      for (const programLength of NOT_EXPECTED_PROGRAM_LENGTH) {
        it(`programCredentialType is ${programCredentialType} and programLength is ${programLength}`, async () => {
          // Arrange
          const assessmentConsolidatedData =
            createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
          assessmentConsolidatedData.programCredentialType =
            programCredentialType;
          assessmentConsolidatedData.programLength = programLength;
          // Act
          const calculatedAssessment =
            await executeFullTimeAssessmentForProgramYear(
              PROGRAM_YEAR,
              assessmentConsolidatedData,
            );
          // Assert
          expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(
            false,
          );
        });
      }
    }
  });

  describe("Should determine BCAG2Year as not eligible when institution type is different then BC Public.", () => {
    const notExpectedInstitutionsTypes = Object.values(InstitutionTypes).filter(
      (type) => type !== InstitutionTypes.BCPublic,
    );
    for (const institutionsType of notExpectedInstitutionsTypes) {
      it(`institution type ${institutionsType}.`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.institutionType = institutionsType;
        assessmentConsolidatedData.programCredentialType =
          CredentialType.GraduateDiploma;
        assessmentConsolidatedData.programLength =
          ProgramLengthOptions.SixtyWeeksToTwoYears;
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(
          false,
        );
      });
    }
  });
});
