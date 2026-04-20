import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import { InstitutionClassification } from "@sims/sims-db";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-appeal-eligibility-accessibility-grant-eligibility.`, () => {
  const appealEligibilityScenarios = [
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grant(SBSD).
        // Since the grant is not eligible for the institution, but eligible at the assessment level
        // the student should eligible to appeal the accessibility grant.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out of province private institutions are not eligible for the accessibility grant(SBSD).
        // Since the grant is not eligible for the institution, but eligible at the assessment level
        // the student should eligible to appeal the accessibility grant.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out of province public institutions are not eligible for the accessibility grant(SBSD).
        // Since the grant is not eligible for the institution, but eligible at the assessment level
        // the student should eligible to appeal the accessibility grant.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Public,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // US institutions are not eligible for the accessibility grant(SBSD).
        // Since the grant is not eligible for the institution, but eligible at the assessment level
        // the student should eligible to appeal the accessibility grant.
        institutionCountry: "US",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Public,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Other international institutions are not eligible for the accessibility grant(SBSD).
        // Since the grant is not eligible for the institution, but eligible at the assessment level
        // the student should eligible to appeal the accessibility grant.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC public institutions are eligible for the accessibility grant(SBSD).
        // Since the grant is eligible at assessment level and for the institution as well
        // the student is not required and must not to appeal for the accessibility grant.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Public,
      },
      expectedAppealEligibility: false,
    },
  ];
  for (const {
    inputData,
    expectedAppealEligibility,
  } of appealEligibilityScenarios) {
    it(
      `Should evaluate the accessibility grant eligibility appeal as ${expectedAppealEligibility ? "eligible" : "not eligible"} when the student PD status is ${inputData.studentDataApplicationPDPPDStatus}` +
        ` and total income is ${inputData.studentDataTaxReturnIncome} and institution country is ${inputData.institutionCountry} and institution province is ${inputData.institutionProvince ?? "NA"} and institution classification is ${inputData.institutionClassification}.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakePartTimeAssessmentConsolidatedData(PROGRAM_YEAR),
          ...inputData,
        };

        // Act
        const calculatedAssessment =
          await executePartTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        expect(
          calculatedAssessment.variables
            .isEligibleForPTAccessibilityGrantEligibilityAppeal,
        ).toBe(expectedAppealEligibility);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
