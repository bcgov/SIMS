import { CredentialType, ProgramLengthOptions } from "../../../models";
import {
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGF.`, () => {
  // Expected and not expected credentials types.
  const EXPECTED_PROGRAM_CREDENTIAL_TYPES = [
    CredentialType.UnderGraduateCertificate,
    CredentialType.UnderGraduateCitation,
    CredentialType.GraduateCertificate,
    CredentialType.UnderGraduateDiploma,
    CredentialType.GraduateDiploma,
    CredentialType.UnderGraduateDegree,
  ];
  const NOT_EXPECTED_PROGRAM_CREDENTIAL_TYPES = Object.values(
    CredentialType,
  ).filter((type) => !EXPECTED_PROGRAM_CREDENTIAL_TYPES.includes(type));
  // Expected and not expected program length options.
  const EXPECTED_PROGRAM_LENGTH = [
    ProgramLengthOptions.TwoToThreeYears,
    ProgramLengthOptions.ThreeToFourYears,
    ProgramLengthOptions.FourToFiveYears,
    ProgramLengthOptions.FiveOrMoreYears,
  ];
  const NOT_EXPECTED_PROGRAM_LENGTH = Object.values(
    ProgramLengthOptions,
  ).filter((type) => !EXPECTED_PROGRAM_LENGTH.includes(type));

  describe(
    "Should determine CSGF as eligible when programCredentialType and programLength are the expected ones " +
      "and financial need is at least $1 and total family income is below the threshold.",
    () => {
      for (const programCredentialType of EXPECTED_PROGRAM_CREDENTIAL_TYPES) {
        for (const programLength of EXPECTED_PROGRAM_LENGTH) {
          it(`programCredentialType is ${programCredentialType} and programLength is ${programLength}`, async () => {
            // Arrange
            const assessmentConsolidatedData =
              createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
            assessmentConsolidatedData.programCredentialType =
              programCredentialType;
            assessmentConsolidatedData.programLength = programLength;
            assessmentConsolidatedData.studentDataTaxReturnIncome = 70000;
            assessmentConsolidatedData.studentDataDependants = [
              createFakeStudentDependentEligible(
                DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
              ),
            ];
            // Act
            const calculatedAssessment =
              await executeFullTimeAssessmentForProgramYear(
                PROGRAM_YEAR,
                assessmentConsolidatedData,
              );
            // Assert
            expect(
              calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
            ).toBe(assessmentConsolidatedData.studentDataTaxReturnIncome);
            expect(
              calculatedAssessment.variables.calculatedDataFamilySize,
            ).toBe(2);
            expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(
              true,
            );
            expect(
              calculatedAssessment.variables.federalAwardNetCSGFAmount,
            ).toBeGreaterThan(0);
            expect(
              calculatedAssessment.variables.provincialAwardNetCSGFAmount,
            ).toBeGreaterThan(0);
          });
        }
      }
    },
  );

  describe(
    "Should determine CSGF as not eligible when programCredentialType and programLength are not the expected ones " +
      "and financial need is at least $1 and total family income is below the threshold.",
    () => {
      for (const programCredentialType of NOT_EXPECTED_PROGRAM_CREDENTIAL_TYPES) {
        for (const programLength of NOT_EXPECTED_PROGRAM_LENGTH) {
          it(`programCredentialType is ${programCredentialType} and programLength is ${programLength}`, async () => {
            // Arrange
            const assessmentConsolidatedData =
              createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
            assessmentConsolidatedData.programCredentialType =
              programCredentialType;
            assessmentConsolidatedData.programLength = programLength;
            assessmentConsolidatedData.studentDataTaxReturnIncome = 70000;
            assessmentConsolidatedData.studentDataDependants = [
              createFakeStudentDependentEligible(
                DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
              ),
            ];
            // Act
            const calculatedAssessment =
              await executeFullTimeAssessmentForProgramYear(
                PROGRAM_YEAR,
                assessmentConsolidatedData,
              );
            // Assert
            expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(
              false,
            );
          });
        }
      }
    },
  );

  it("Should determine CSGF as not eligible when total family income is above the threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    // 105872 is the threshold for a family of 3 (2 dependents + the student).
    assessmentConsolidatedData.studentDataTaxReturnIncome = 105873;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
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
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(3);
    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(false);
  });
});
