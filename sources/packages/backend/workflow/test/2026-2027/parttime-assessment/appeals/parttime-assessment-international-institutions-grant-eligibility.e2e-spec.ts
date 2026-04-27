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

type AwardType = "CSPT" | "SBSD" | "CSGP" | "CSGD" | "BCAG" | "CSLP";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-international-institutions-grant-eligibility.`, () => {
  /**
   * Maps award type to the expected eligibility property names.
   */
  const getEligibilityPropertyNames = (
    awardType: AwardType,
  ): {
    award: string;
    assessment: string;
    institution: string;
  } => {
    const mapping: Record<
      AwardType,
      { award: string; assessment: string; institution: string }
    > = {
      CSPT: {
        award: "awardEligibilityCSPT",
        assessment: "assessmentEligibilityCSPT",
        institution: "institutionEligibilityCSPT",
      },
      SBSD: {
        award: "awardEligibilitySBSD",
        assessment: "assessmentEligibilitySBSD",
        institution: "institutionEligibilitySBSD",
      },
      CSGP: {
        award: "awardEligibilityCSGP",
        assessment: "assessmentEligibilityCSGP",
        institution: "institutionEligibilityCSGP",
      },
      CSGD: {
        award: "awardEligibilityCSGD",
        assessment: "assessmentEligibilityCSGD",
        institution: "institutionEligibilityCSGD",
      },
      BCAG: {
        award: "awardEligibilityBCAG",
        assessment: "assessmentEligibilityBCAG",
        institution: "institutionEligibilityBCAG",
      },
      CSLP: {
        award: "awardEligibilityCSLP",
        assessment: "assessmentEligibilityCSLP",
        institution: "institutionEligibilityCSLP",
      },
    };
    return mapping[awardType];
  };

  /**
   * Maps award type to the calculated assessment variables property names.
   */
  const getVariablePropertyNames = (
    awardType: AwardType,
  ): {
    award: string;
    assessment: string;
    institution: string;
  } => {
    const mapping: Record<
      AwardType,
      { award: string; assessment: string; institution: string }
    > = {
      CSPT: {
        award: "awardEligibilityCSPT",
        assessment: "assessmentEligibilityCSPT",
        institution: "isEligibleCSPT",
      },
      SBSD: {
        award: "awardEligibilitySBSD",
        assessment: "assessmentEligibilitySBSD",
        institution: "isEligibleSBSD",
      },
      CSGP: {
        award: "awardEligibilityCSGP",
        assessment: "assessmentEligibilityCSGP",
        institution: "isEligibleCSGP",
      },
      CSGD: {
        award: "awardEligibilityCSGD",
        assessment: "assessmentEligibilityCSGD",
        institution: "isEligibleCSGD",
      },
      BCAG: {
        award: "awardEligibilityBCAG",
        assessment: "assessmentEligibilityBCAG",
        institution: "isEligibleBCAG",
      },
      CSLP: {
        award: "awardEligibilityCSLP",
        assessment: "assessmentEligibilityCSLP",
        institution: "isEligibleCSLP",
      },
    };
    return mapping[awardType];
  };

  /**
   * Gets the expected eligibility value for a given award type from expectedData.
   */
  const getExpectedEligibility = (
    expectedData: (typeof grantEligibilityScenarios)[number]["expectedData"],
    awardType: AwardType,
    property: "award" | "assessment" | "institution",
  ): boolean => {
    const props = getEligibilityPropertyNames(awardType);
    const key = props[property] as keyof typeof expectedData;
    return expectedData[key];
  };

  const grantEligibilityScenarios = [
    {
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
        assessmentEligibilitySBSD: false,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: false,
        awardEligibilityCSGP: false,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: false,
        awardEligibilityCSGD: false,
        assessmentEligibilityBCAG: true,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: true,
        assessmentEligibilityCSLP: true,
        institutionEligibilityCSLP: false,
        awardEligibilityCSLP: true,
      },
    },
    {
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
        assessmentEligibilitySBSD: false,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: false,
        awardEligibilityCSGP: false,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: false,
        awardEligibilityCSGD: false,
        assessmentEligibilityBCAG: true,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,
        assessmentEligibilityCSLP: true,
        institutionEligibilityCSLP: false,
        awardEligibilityCSLP: false,
      },
    },
    {
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
        assessmentEligibilitySBSD: false,
        institutionEligibilitySBSD: true,
        awardEligibilitySBSD: false,
        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: false,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityBCAG: true,
        institutionEligibilityBCAG: true,
        awardEligibilityBCAG: true,
        assessmentEligibilityCSLP: true,
        institutionEligibilityCSLP: true,
        awardEligibilityCSLP: true,
      },
    },
    {
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
        assessmentEligibilityCSPT: true,
        institutionEligibilityCSPT: true,
        awardEligibilityCSPT: true,
        assessmentEligibilitySBSD: false,
        institutionEligibilitySBSD: true,
        awardEligibilitySBSD: false,
        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: false,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityBCAG: true,
        institutionEligibilityBCAG: true,
        awardEligibilityBCAG: true,
        assessmentEligibilityCSLP: true,
        institutionEligibilityCSLP: true,
        awardEligibilityCSLP: true,
      },
    },
    {
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
        assessmentEligibilityCSPT: true,
        institutionEligibilityCSPT: true,
        awardEligibilityCSPT: true,
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: false,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: true,
        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,
        assessmentEligibilityBCAG: true,
        institutionEligibilityBCAG: false,
        awardEligibilityBCAG: false,
        assessmentEligibilityCSLP: true,
        institutionEligibilityCSLP: true,
        awardEligibilityCSLP: true,
      },
    },
  ];

  const allAwardTypes: AwardType[] = [
    "CSPT",
    "SBSD",
    "CSGP",
    "CSGD",
    "BCAG",
    "CSLP",
  ];

  for (const { inputData, expectedData } of grantEligibilityScenarios) {
    for (const awardType of allAwardTypes) {
      const variableProps = getVariablePropertyNames(awardType);

      const expectedAwardEligibility = getExpectedEligibility(
        expectedData,
        awardType,
        "award",
      );
      const expectedAssessmentEligibility = getExpectedEligibility(
        expectedData,
        awardType,
        "assessment",
      );
      const expectedInstitutionEligibility = getExpectedEligibility(
        expectedData,
        awardType,
        "institution",
      );

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
          expect(
            (
              calculatedAssessment.variables as unknown as Record<
                string,
                unknown
              >
            )[variableProps.assessment],
          ).toBe(expectedAssessmentEligibility);
          expect(
            (
              calculatedAssessment.variables
                .dmnPartTimeAwardInstitutionEligibility as unknown as Record<
                string,
                unknown
              >
            )[variableProps.institution],
          ).toBe(expectedInstitutionEligibility);
          expect(
            (
              calculatedAssessment.variables as unknown as Record<
                string,
                unknown
              >
            )[variableProps.award],
          ).toBe(expectedAwardEligibility);
        },
      );
    }
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
