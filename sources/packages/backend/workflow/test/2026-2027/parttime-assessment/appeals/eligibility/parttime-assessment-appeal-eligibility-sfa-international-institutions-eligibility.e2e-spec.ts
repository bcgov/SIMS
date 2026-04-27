import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { Provinces } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-appeal-eligibility-sfa-international-institutions-eligibility.`, () => {
  const appealEligibilityScenarios = [
    {
      inputData: {
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // BC public institutions are eligible for some of the SFA grants and not eligible for the appeal.
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // BC private non-profit institutions are eligible for some of the SFA grants
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // BC private for-profit institutions are eligible for some of the SFA grants
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // Out of province Canadian public institutions are eligible for some of the SFA grants
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // Out of province Canadian private non-profit institutions are eligible for some of the SFA grants
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // Out of province Canadian private for-profit institutions are eligible for some of the SFA grants
        // and not eligible for the appeal because they are not international institutions.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedAppealEligibility: false,
    },
    {
      inputData: {
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // International public non-profit institutions are eligible for some of the SFA grants
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // International private non-profit institutions are eligible for some of the SFA grants
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
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // International private for-profit institutions are the only institution type eligible for the
        // SFA eligibility international institutions train out provision appeal.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedAppealEligibility: true,
    },
    {
      inputData: {
        // The following values make some of the SFA grants eligible at assessment level.
        studentDataCRAReportedIncome: 100000,
        studentDataTaxReturnIncome: 3000000,
        // International private for-profit institutions are the only institution type eligible for the
        // SFA eligibility international institutions train out provision appeal.
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
      `Should evaluate the international institutions appeal eligibility as ${expectedAppealEligibility ? "eligible" : "not eligible"}` +
        ` when total income is ${inputData.studentDataTaxReturnIncome} and institution country is ${inputData.institutionCountry} and institution province is ${inputData.institutionProvince ?? "NA"} and institution classification is ${inputData.institutionClassification}` +
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
            .isEligibleForPTSFAInternationalInstitutionsEligibilityAppeal,
        ).toBe(expectedAppealEligibility);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
