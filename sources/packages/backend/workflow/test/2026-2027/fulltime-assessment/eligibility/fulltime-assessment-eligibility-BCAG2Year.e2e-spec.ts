import { Provinces } from "@sims/test-utils";
import { CredentialType, ProgramLengthOptions } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
} from "../../../test-utils/factories";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

/**
 * BCAG2Year is a variation for BCAG due to differences in the way thatBCAGWeeklyProratedMaximumGrant
 * is calculated where dmnFullTimeAwardFederalAllowableLimits defines different values for BCAG and BCAG2Year
 * where both will result in the BCAG calculation.
 * These tests are only intended to check the BCAG2Year eligibility.
 */
describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-BCAG2Year.`, () => {
  // Expected and not expected credentials types.
  const EXPECTED_PROGRAM_CREDENTIAL_TYPES = [
    CredentialType.UnderGraduateCitation,
    CredentialType.UnderGraduateDiploma,
    CredentialType.UnderGraduateDegree,
    CredentialType.UnderGraduateCertificate,
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

  const TEST_AWARD_ELIGIBILITY = [
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
      },
      expectedData: {
        expectedAssessmentEligibility: true,
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
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
        studentDataTaxReturnIncome: 79719, // Income is higher than the threshold for a family of 1 (the student).
      },
      expectedData: {
        expectedAssessmentEligibility: false,
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: false,
      },
    },
  ];
  for (const testEligibility of TEST_AWARD_ELIGIBILITY) {
    it(
      `Should determine BCAG as ${testEligibility.expectedData.expectedAwardEligibility ? "eligible" : "not eligible"} when the assessment is ${testEligibility.expectedData.expectedAssessmentEligibility ? "eligible" : "not eligible"} and ` +
        `institution is ${testEligibility.expectedData.expectedInstitutionEligibility ? "eligible" : "not eligible"}.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
          ...testEligibility.inputData,
        };
        assessmentConsolidatedData.programCredentialType =
          CredentialType.UnderGraduateDiploma;
        assessmentConsolidatedData.programLength =
          ProgramLengthOptions.SixtyWeeksToTwoYears;
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(
          calculatedAssessment.variables.assessmentEligibilityBCAG2Year,
        ).toBe(testEligibility.expectedData.expectedAssessmentEligibility);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
            .isEligibleBCAG,
        ).toBe(testEligibility.expectedData.expectedInstitutionEligibility);
        expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(
          testEligibility.expectedData.expectedAwardEligibility,
        );
      },
    );
  }

  describe(
    "Should determine BCAG2Year as assessment eligible when programCredentialType and programLength are the expected ones, " +
      "financial need is at least $1 and total family income is below the threshold.",
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
            assessmentConsolidatedData.studentDataTaxReturnIncome = 48204;
            // Act
            const calculatedAssessment =
              await executeFullTimeAssessmentForProgramYear(
                PROGRAM_YEAR,
                assessmentConsolidatedData,
              );
            // Assert
            expect(
              calculatedAssessment.variables.assessmentEligibilityBCAG2Year,
            ).toBe(true);
            expect(
              calculatedAssessment.variables.provincialAwardNetBCAGAmount,
            ).toBeGreaterThan(0);
          });
        }
      }
    },
  );

  describe("Should determine BCAG2Year as not assessment eligible when programCredentialType and programLength are not the expected ones.", () => {
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
          expect(
            calculatedAssessment.variables.assessmentEligibilityBCAG2Year,
          ).toBe(false);
        });
      }
    }
  });

  it("Should determine BCAG2Year as not assessment eligible when family income is above the threshold for the family size.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.GraduateDiploma;
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.SixtyWeeksToTwoYears;
    assessmentConsolidatedData.studentDataTaxReturnIncome = 82195; // 82194 is the threshold for a family of 3 (the student and two dependents).
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
    expect(calculatedAssessment.variables.assessmentEligibilityBCAG2Year).toBe(
      false,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
