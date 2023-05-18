import { CredentialType, ProgramLengthOptions } from "../../models";
import {
  createFakeConsolidatedFulltimeData,
  executeFulltimeAssessmentForProgramYear,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
} from "../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGF`, () => {
  describe(
    "Should determine CSGF (federal and provincial) as eligible when programCredentialType and programLength are the expected ones " +
      "and financial need is at least $1 and total family income is below the threshold.",
    () => {
      const expectedProgramCredentialTypes = [
        CredentialType.UnderGraduateCertificate,
        CredentialType.GraduateCertificate,
        CredentialType.UnderGraduateDiploma,
        CredentialType.GraduateDiploma,
        CredentialType.UnderGraduateDegree,
      ];
      const expectedProgramLength = [
        ProgramLengthOptions.TwoToThreeYears,
        ProgramLengthOptions.ThreeToFourYears,
        ProgramLengthOptions.FourToFiveYears,
        ProgramLengthOptions.FiveOrMoreYears,
      ];
      for (const programCredentialType of expectedProgramCredentialTypes) {
        for (const programLength of expectedProgramLength) {
          it(`programCredentialType is ${programCredentialType} and programLength is ${programLength}`, async () => {
            // Arrange
            const assessmentConsolidatedData =
              createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
            assessmentConsolidatedData.programCredentialType =
              programCredentialType;
            assessmentConsolidatedData.programLength = programLength;
            ProgramLengthOptions.FourToFiveYears;
            assessmentConsolidatedData.studentDataTaxReturnIncome = 70000;
            assessmentConsolidatedData.studentDataDependants = [
              createFakeStudentDependentEligible(
                DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
              ),
            ];
            // Act
            const calculatedAssessment =
              await executeFulltimeAssessmentForProgramYear(
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

  it("Should determine CSGF (federal and provincial) as not eligible when total family income is above the threshold.", async () => {
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
    const calculatedAssessment = await executeFulltimeAssessmentForProgramYear(
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

  it("Should determine CSGF (federal and provincial) as not eligible when programCredentialType is not expected.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.GraduateDegreeOrMasters;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwoToThreeYears;
    assessmentConsolidatedData.studentDataTaxReturnIncome = 50000;
    // Act
    const calculatedAssessment = await executeFulltimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(1);
    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(false);
  });

  it("Should determine CSGF (federal and provincial) as not eligible when programLength is not expected.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.UnderGraduateCertificate;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.WeeksToLessThanYear;
    assessmentConsolidatedData.studentDataTaxReturnIncome = 50000;
    // Act
    const calculatedAssessment = await executeFulltimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(1);
    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(false);
  });
});
