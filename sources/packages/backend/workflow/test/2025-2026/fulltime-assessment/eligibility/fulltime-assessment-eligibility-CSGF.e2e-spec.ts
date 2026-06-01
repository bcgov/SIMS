import { CredentialType, ProgramLengthOptions } from "../../../models";
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
                {
                  referenceDate:
                    assessmentConsolidatedData.offeringStudyStartDate,
                },
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
                {
                  referenceDate:
                    assessmentConsolidatedData.offeringStudyStartDate,
                },
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
    // 115978 is the threshold for a family of 3 (2 dependents + the student).
    assessmentConsolidatedData.studentDataTaxReturnIncome = 115979;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
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
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(3);
    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(false);
  });

  it("Should cap CSGF at the 6300 annual maximum when offering weeks exceed the limit in 2025-2026.", async () => {
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
    const expectedWeeklyAmount = 121.15;
    const annualCap = 6300;
    const uncappedAmount =
      expectedWeeklyAmount * assessmentConsolidatedData.offeringWeeks;

    expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(true);
    // 121.15 * 60 weeks = 7269, which is above the annual cap and should be capped to 6300.
    expect(uncappedAmount).toBeGreaterThan(annualCap);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGFAmount,
    ).toBeCloseTo(annualCap, 2);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGFAmount,
    ).toBeLessThan(uncappedAmount);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
