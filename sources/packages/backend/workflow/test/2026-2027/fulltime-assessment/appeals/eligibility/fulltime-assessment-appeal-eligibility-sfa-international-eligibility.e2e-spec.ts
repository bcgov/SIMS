import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";
import { Provinces } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-sfa-international-eligibility.`, () => {
  const appealEligibilityScenarios = [
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // BC public institutions are eligible for funding (e.g. CSLF)
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
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // BC private non-profit institutions are eligible for funding (e.g. CSLF)
        // and not eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // BC private profit institutions are eligible for funding (e.g. CSLF)
        // and not eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // Out of province public institutions are eligible for funding (e.g. CSLF)
        // and not eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // Out of province private non-profit institutions are eligible for funding (e.g. CSLF)
        // and not eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // Out of province private profit institutions are eligible for funding (e.g. CSLF)
        // and not eligible for the appeal.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // Other international public institutions are eligible for funding (e.g. CSLF))
        // and not eligible for the appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the assessment eligible for CSLF.
        studentDataTaxReturnIncome: 30000,
        // Other international private non-profit institutions are eligible for funding (e.g. CSLF)
        // and not eligible for the appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make the application eligible for at least one award type .
        studentDataTaxReturnIncome: 30000,
        // Other international private profit institutions are not eligible for funding (e.g. CSLF)
        // and eligible for the appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values eliminate all funding needs.
        studentDataTaxReturnIncome: 500000,
        offeringWeeks: 5,
        offeringProgramRelatedCosts: 30,
        offeringActualTuitionCosts: 50,
        studentDataVoluntaryContributions: 10000,
        // Other international private profit institutions are not eligible for funding (e.g. CSLF)
        // and eligible for the appeal.
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
      `Should evaluate the SFA International Institutions eligibility appeal as ${expectedAppealEligibility ? "eligible" : "not eligible"} when the total income is ${inputData.studentDataTaxReturnIncome}` +
        ` and institution country is ${inputData.institutionCountry} and institution province is ${inputData.institutionProvince ?? "NA"} and institution classification is ${inputData.institutionClassification}` +
        ` and institution organization status is ${inputData.institutionOrganizationStatus}.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakeAssessmentConsolidatedData(PROGRAM_YEAR),
          ...inputData,
        };
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(
          calculatedAssessment.variables
            .isEligibleForFTSFAInternationalEligibilityAppeal,
        ).toBe(expectedAppealEligibility);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
