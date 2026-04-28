import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";
import { CalculatedAssessmentModel } from "../../../models";
import { YesNoOptions } from "@sims/test-utils";
import {
  DependentChildCareEligibility,
  createFakeStudentDependentEligibleForChildcareCost,
} from "../../../test-utils/factories";

const [, programEndYear] = PROGRAM_YEAR.split("-");
const offeringStudyStartDate = `${programEndYear}-02-01`;
const offeringStudyEndDate = `${programEndYear}-05-24`;

describe(`E2E Test Workflow parttime-assessment-sfa-${PROGRAM_YEAR}-international-institutions-eligibility.`, () => {
  const grantEligibilityScenarios = [
    {
      inputData: {
        // The following values make the SFA funding (e.g. CSPT, SBSD, CSGP, CSGD) eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        // A dependent under 11 years old is required for CSGD assessment eligibility.
        offeringStudyStartDate,
        offeringStudyEndDate,
        studentDataHasDependents: YesNoOptions.Yes,
        studentDataDependants: [
          createFakeStudentDependentEligibleForChildcareCost(
            DependentChildCareEligibility.Eligible0To11YearsOld,
            offeringStudyStartDate,
          ),
        ],
        // International for-profit institutions are not eligible for the SFA funding (e.g. CSPT).
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
        assessmentEligibilitySBSD: true,
        institutionEligibilitySBSD: false,
        awardEligibilitySBSD: true,
        assessmentEligibilityCSGP: true,
        institutionEligibilityCSGP: false,
        awardEligibilityCSGP: true,
        assessmentEligibilityCSGD: true,
        institutionEligibilityCSGD: false,
        awardEligibilityCSGD: true,
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
  ];

  for (const { inputData, expectedData } of grantEligibilityScenarios) {
    it(
      `Should return expected SFA grants eligibility outcomes when assessment and institution eligibility rules are applied` +
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
 * for all SFA award types.
 * @param calculatedAssessment the calculated assessment model containing all
 * award eligibility variables and the institution eligibility DMN results.
 * @returns a flat object with eligibility flags for each award type at the
 * assessment, institution, and final award levels.
 */
function getEligibilityData(calculatedAssessment: CalculatedAssessmentModel) {
  return {
    assessmentEligibilityCSPT: calculatedAssessment.assessmentEligibilityCSPT,
    institutionEligibilityCSPT:
      calculatedAssessment.dmnPartTimeAwardInstitutionEligibility
        ?.isEligibleCSPT,
    awardEligibilityCSPT: calculatedAssessment.awardEligibilityCSPT,
    assessmentEligibilitySBSD: calculatedAssessment.assessmentEligibilitySBSD,
    institutionEligibilitySBSD:
      calculatedAssessment.dmnPartTimeAwardInstitutionEligibility
        ?.isEligibleSBSD,
    awardEligibilitySBSD: calculatedAssessment.awardEligibilitySBSD,
    assessmentEligibilityCSGP: calculatedAssessment.assessmentEligibilityCSGP,
    institutionEligibilityCSGP:
      calculatedAssessment.dmnPartTimeAwardInstitutionEligibility
        ?.isEligibleCSGP,
    awardEligibilityCSGP: calculatedAssessment.awardEligibilityCSGP,
    assessmentEligibilityCSGD: calculatedAssessment.assessmentEligibilityCSGD,
    institutionEligibilityCSGD:
      calculatedAssessment.dmnPartTimeAwardInstitutionEligibility
        ?.isEligibleCSGD,
    awardEligibilityCSGD: calculatedAssessment.awardEligibilityCSGD,
    assessmentEligibilityBCAG: calculatedAssessment.assessmentEligibilityBCAG,
    institutionEligibilityBCAG:
      calculatedAssessment.dmnPartTimeAwardInstitutionEligibility
        ?.isEligibleBCAG,
    awardEligibilityBCAG: calculatedAssessment.awardEligibilityBCAG,
    assessmentEligibilityCSLP: calculatedAssessment.assessmentEligibilityCSLP,
    institutionEligibilityCSLP:
      calculatedAssessment.dmnPartTimeAwardInstitutionEligibility
        ?.isEligibleCSLP,
    awardEligibilityCSLP: calculatedAssessment.awardEligibilityCSLP,
  };
}
