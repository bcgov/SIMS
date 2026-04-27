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
        assessmentEligibilityCSPT: true,
        institutionEligibilityCSPT: false,
        awardEligibilityCSPT: true,
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
        assessmentEligibilityCSPT: true,
        institutionEligibilityCSPT: false,
        awardEligibilityCSPT: false,
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
        assessmentEligibilityCSPT: true,
        institutionEligibilityCSPT: true,
        awardEligibilityCSPT: true,
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
        assessmentEligibilitySBSD: false,
        institutionEligibilitySBSD: true,
        awardEligibilitySBSD: false,
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
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
      },
    },
  ];
  for (const {
    awardType,
    inputData,
    expectedData,
  } of grantEligibilityScenarios) {
    const expectedAwardEligibility =
      awardType === "CSPT"
        ? expectedData.awardEligibilityCSPT
        : expectedData.awardEligibilitySBSD;

    it(
      `Should return ${expectedAwardEligibility ? "eligible" : "not eligible"} for SFA grant ${awardType} when assessment and institution eligibility rules are applied` +
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
            expectedAwardEligibility,
          );
          expect(calculatedAssessment.variables.assessmentEligibilityCSPT).toBe(
            expectedData.assessmentEligibilityCSPT,
          );
          expect(
            calculatedAssessment.variables
              .dmnPartTimeAwardInstitutionEligibility?.isEligibleCSPT,
          ).toBe(expectedData.institutionEligibilityCSPT);
          return;
        }

        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          expectedAwardEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          expectedData.assessmentEligibilitySBSD,
        );
        expect(
          calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
            ?.isEligibleSBSD,
        ).toBe(expectedData.institutionEligibilitySBSD);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
