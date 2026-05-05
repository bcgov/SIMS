import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
  getFullTimeEligibilityData,
} from "../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-sfa-oop-private-institutions-eligibility.`, () => {
  const grantEligibilityScenarios = [
    {
      inputData: {
        // The following values make some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private not-for-profit institutions are not eligible for some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL).
        // But if the application has an approved SFA OOP private institutions eligibility appeal, the SFA funding will be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: true,
        assessmentEligibilityBCAG: false,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,
        assessmentEligibilityBCAG2Year: true,
        awardEligibilityBCAG2Year: true,
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: true,
        assessmentEligibilityCSGF: true,
        institutionEligibilityCSGF: true,
        awardEligibilityCSGF: true,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
      },
    },
    {
      inputData: {
        // The following values make some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private not-for-profit institutions are not eligible for some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL).
        // The application does not have an approved SFA OOP private institutions eligibility appeal, so the SFA funding will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData: undefined,
      },
      expectedData: {
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
        assessmentEligibilityBCAG: false,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,
        assessmentEligibilityBCAG2Year: true,
        awardEligibilityBCAG2Year: false,
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: false,
        assessmentEligibilityCSGF: true,
        institutionEligibilityCSGF: true,
        awardEligibilityCSGF: true,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
      },
    },
    {
      inputData: {
        // The following values make some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private for-profit institutions are not eligible for some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL).
        // But if the application has an approved SFA OOP private institutions eligibility appeal, the SFA funding will be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: true,
        assessmentEligibilityBCAG: false,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,
        assessmentEligibilityBCAG2Year: true,
        awardEligibilityBCAG2Year: true,
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: true,
        assessmentEligibilityCSGF: true,
        institutionEligibilityCSGF: false,
        awardEligibilityCSGF: false,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
      },
    },
    {
      inputData: {
        // The following values make some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private for-profit institutions are not eligible for some of the SFA funding (e.g. BCAG2Year, SBSD, BCSL).
        // The application does not have an approved SFA OOP private institutions eligibility appeal, so the SFA funding will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData: undefined,
      },
      expectedData: {
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
        assessmentEligibilityBCAG: false,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,
        assessmentEligibilityBCAG2Year: true,
        awardEligibilityBCAG2Year: false,
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: false,
        assessmentEligibilityCSGF: true,
        institutionEligibilityCSGF: false,
        awardEligibilityCSGF: false,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
      },
    },
  ];

  for (const { inputData, expectedData } of grantEligibilityScenarios) {
    it(
      `Should return expected SFA grants eligibility outcomes when assessment and institution eligibility rules are applied` +
        ` ${inputData.appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData ? "with" : "without"} an approved OOP private institutions SFA eligibility appeal.`,
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

        const eligibilityData = getFullTimeEligibilityData(
          calculatedAssessment.variables,
        );
        // Assert
        expect(eligibilityData).toEqual(expectedData);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
