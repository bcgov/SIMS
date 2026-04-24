import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

type AwardType = "CSPT" | "SBSD";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-international-institutions-grant-eligibility.`, () => {
  const grantEligibilityScenarios = [
    {
      awardType: "CSPT" as AwardType,
      inputData: {
        // The following values make the SFA grant (CSPT) eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // International for-profit institutions are not eligible for the SFA grants(CSPT).
        // But if the application has approved SFA eligibility international institutions appeal, the SFA grants will be eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsPTSFAEligibilityInternationalInstitutionsAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentEligibility: true,
        institutionEligibility: false,
        awardEligibility: true,
      },
    },
    {
      awardType: "CSPT" as AwardType,
      inputData: {
        // The following values make the SFA grant (CSPT) eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // International for-profit institutions are not eligible for the SFA grants (CSPT).
        // The application does not have an approved SFA eligibility international institutions appeal, so the SFA grants will not be eligible.
        institutionCountry: "AU",
        institutionProvince: undefined,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsPTSFAEligibilityInternationalInstitutionsAppealData: undefined,
      },
      expectedData: {
        assessmentEligibility: true,
        institutionEligibility: false,
        awardEligibility: false,
      },
    },
    {
      awardType: "CSPT" as AwardType,
      inputData: {
        // The following values make the SFA grant (CSPT) eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // BC public institutions are eligible for the SFA grants (CSPT) at both assessment and institution level.
        // The international institutions train out provision appeal does not apply to BC public institutions.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        assessmentEligibility: true,
        institutionEligibility: true,
        awardEligibility: true,
      },
    },
    {
      awardType: "SBSD" as AwardType,
      inputData: {
        // The following values make the SFA grant (SBSD) not eligible at assessment level.
        studentDataTaxReturnIncome: 200000,
        // BC public institutions are eligible at the institution level,
        // but the SFA grants will not be eligible due to assessment eligibility being false.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        assessmentEligibility: false,
        institutionEligibility: true,
        awardEligibility: false,
      },
    },
    {
      awardType: "SBSD" as AwardType,
      inputData: {
        // The following values make the SFA grant (SBSD) eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        // Out-of-province Canadian private institutions are not eligible for the SFA grants(SBSD).
        // The international institutions train out provision appeal does not apply to out-of-province institutions.
        institutionCountry: "CA",
        institutionProvince: Provinces.Ontario,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        assessmentEligibility: true,
        institutionEligibility: false,
        awardEligibility: false,
      },
    },
  ];
  for (const {
    awardType,
    inputData,
    expectedData,
  } of grantEligibilityScenarios) {
    it(
      `Should return ${expectedData.awardEligibility ? "eligible" : "not eligible"} for SFA grant ${awardType} when assessment and institution eligibility rules are applied` +
        ` ${inputData.appealsPTSFAEligibilityInternationalInstitutionsAppealData ? "with" : "without"} an approved international institutions SFA eligibility appeal.`,
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
        if (awardType === "CSPT") {
          expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(
            expectedData.awardEligibility,
          );
          expect(calculatedAssessment.variables.assessmentEligibilityCSPT).toBe(
            expectedData.assessmentEligibility,
          );
          expect(
            calculatedAssessment.variables
              .dmnPartTimeAwardInstitutionEligibility?.isEligibleCSPT,
          ).toBe(expectedData.institutionEligibility);
          return;
        }

        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          expectedData.awardEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          expectedData.assessmentEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
            ?.isEligibleSBSD,
        ).toBe(expectedData.institutionEligibility);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
