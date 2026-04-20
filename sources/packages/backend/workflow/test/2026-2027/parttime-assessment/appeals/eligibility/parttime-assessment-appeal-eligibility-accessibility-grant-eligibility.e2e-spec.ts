import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-appeal-eligibility-accessibility-grant-eligibility.`, () => {
  const appealEligibilityScenarios = [
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out of province public institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out of province private institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out of province public institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // US institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "US",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Other international public institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Other international private non-profit institutions are not eligible for the accessibility grant
        // and eligible for the appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC public institutions are eligible for the accessibility grant
        // and not eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the accessibility grant eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Other international private profit institutions are not eligible for the accessibility grant
        // and also not eligible for the appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
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
        ` and total income is ${inputData.studentDataTaxReturnIncome} and institution country is ${inputData.institutionCountry} and institution province is ${inputData.institutionProvince ?? "NA"} and institution classification is ${inputData.institutionClassification}` +
        ` and institution organization status is ${inputData.institutionOrganizationStatus}.`,
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
