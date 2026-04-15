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
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";
import { Provinces } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGF.`, () => {
  const TEST_AWARD_ELIGIBILITY = [
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedAssessmentEligibility: true,
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: true,
      },
    },
    {
      inputData: {
        institutionCountry: "AU",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedData: {
        expectedAssessmentEligibility: true,
        expectedInstitutionEligibility: false,
        expectedAwardEligibility: false,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        studentDataTaxReturnIncome: 120000, // Ensures that the income is high enough to be above the threshold for eligibility.
      },
      expectedData: {
        expectedAssessmentEligibility: false, // Above income threshold for eligibility.
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: false,
      },
    },
  ];
  for (const testEligibility of TEST_AWARD_ELIGIBILITY) {
    it(
      `Should determine CSGF as ${testEligibility.expectedData.expectedAwardEligibility ? "eligible" : "not eligible"} when the assessment is ${testEligibility.expectedData.expectedAssessmentEligibility ? "eligible" : "not eligible"} and ` +
        `institution is ${testEligibility.expectedData.expectedInstitutionEligibility ? "eligible" : "not eligible"}.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
          ...testEligibility.inputData,
        };
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(calculatedAssessment.variables.assessmentEligibilityCSGF).toBe(
          testEligibility.expectedData.expectedAssessmentEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
            .isEligibleCSGF,
        ).toBe(testEligibility.expectedData.expectedInstitutionEligibility);
        expect(calculatedAssessment.variables.awardEligibilityCSGF).toBe(
          testEligibility.expectedData.expectedAwardEligibility,
        );
      },
    );
  }

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
    "Should determine CSGF as assessment eligible when programCredentialType and programLength are the expected ones " +
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
            expect(
              calculatedAssessment.variables.assessmentEligibilityCSGF,
            ).toBe(true);
          });
        }
      }
    },
  );

  describe(
    "Should determine CSGF as not assessment eligible when programCredentialType and programLength are not the expected ones " +
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
            expect(
              calculatedAssessment.variables.assessmentEligibilityCSGF,
            ).toBe(false);
          });
        }
      }
    },
  );

  it("Should determine CSGF as not assessment eligible when total family income is above the threshold.", async () => {
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
    expect(calculatedAssessment.variables.assessmentEligibilityCSGF).toBe(
      false,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
