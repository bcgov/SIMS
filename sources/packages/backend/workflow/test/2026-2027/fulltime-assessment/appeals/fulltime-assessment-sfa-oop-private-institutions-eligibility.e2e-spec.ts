import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";
import { CalculatedAssessmentModel } from "../../../models";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-sfa-oop-private-institutions-eligibility.`, () => {
  const grantEligibilityScenarios = [
    {
      inputData: {
        // The following values make the SFA funding (e.g. BCSL, BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private not-for-profit institutions are not eligible for some of the SFA funding (e.g. BCSL, BGPD, SBSD).
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
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: true,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: true,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: true,
      },
    },
    {
      inputData: {
        // The following values make the SFA funding (e.g. BCSL, BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private not-for-profit institutions are not eligible for some of the SFA funding (e.g. BCSL, BGPD, SBSD).
        // The application does not have an approved SFA OOP private institutions eligibility appeal, so the SFA funding will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData: undefined,
      },
      expectedData: {
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: false,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
      },
    },
    {
      inputData: {
        // The following values make the SFA funding (e.g. BCSL, BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private for-profit institutions are not eligible for some of the SFA funding (e.g. BCSL, BGPD, SBSD).
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
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: true,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: true,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: true,
      },
    },
    {
      inputData: {
        // The following values make the SFA funding (e.g. BCSL, BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // Out-of-province Canadian private for-profit institutions are not eligible for some of the SFA funding (e.g. BCSL, BGPD, SBSD).
        // The application does not have an approved SFA OOP private institutions eligibility appeal, so the SFA funding will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTSFAEligibilityOutOfProvinceInstitutionsAppealData: undefined,
      },
      expectedData: {
        assessmentEligibilityBCSL: true,
        institutionEligibilityBCSL: false,
        awardEligibilityBCSL: false,
        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityBGPD: true,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
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

        const eligibilityData = getEligibilityData(
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

/**
 * Extracts the eligibility outcome properties from the calculated assessment
 * for the SFA award types relevant to the OOP private institutions eligibility appeal.
 * @param calculatedAssessment the calculated assessment model containing all award eligibility variables and the institution eligibility DMN results.
 * @returns a flat object with eligibility flags for each award type at the assessment, institution, and final award levels.
 */
function getEligibilityData(calculatedAssessment: CalculatedAssessmentModel) {
  return {
    assessmentEligibilityBCSL: calculatedAssessment.assessmentEligibilityBCSL,
    institutionEligibilityBCSL:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBCSL,
    awardEligibilityBCSL: calculatedAssessment.awardEligibilityBCSL,
    assessmentEligibilityCSLF: calculatedAssessment.assessmentEligibilityCSLF,
    institutionEligibilityCSLF:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSLF,
    awardEligibilityCSLF: calculatedAssessment.awardEligibilityCSLF,
    assessmentEligibilityCSGP: calculatedAssessment.assessmentEligibilityCSGP,
    institutionEligibilityCSGP:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGP,
    awardEligibilityCSGP: calculatedAssessment.awardEligibilityCSGP,
    assessmentEligibilityBGPD: calculatedAssessment.assessmentEligibilityBGPD,
    institutionEligibilityBGPD:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBGPD,
    awardEligibilityBGPD: calculatedAssessment.awardEligibilityBGPD,
    assessmentEligibilitySBSD: calculatedAssessment.assessmentEligibilitySBSD,
    institutionEligibilitySBSD:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleSBSD,
    awardEligibilitySBSD: calculatedAssessment.awardEligibilitySBSD,
  };
}
