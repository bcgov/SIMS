import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { CalculatedAssessmentModel } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { Provinces } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-canada-student-grant-eligibility-appeal.`, () => {
  const appealScenarios = [
    {
      inputData: {
        // The following values make CSGF eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for CSGF and are eligible for the appeal.
        // The application does not have an approved CSG-FT exemption provision appeal, so the award is not eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTCanadaStudentGrantEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentEligibilityBGPD: false,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,

        assessmentEligibilitySBSD: false,
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

        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: false,

        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
      },
    },
    {
      inputData: {
        // The following values make CSGF eligible at assessment level.
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for CSGF and are eligible for the appeal.
        // The application has an approved CSG-FT exemption provision appeal, so the award is eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        appealsFTCanadaStudentGrantEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentEligibilityBGPD: false,
        institutionEligibilityBGPD: false,
        awardEligibilityBGPD: false,

        assessmentEligibilitySBSD: false,
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
        awardEligibilityCSGF: true,

        assessmentEligibilityCSGD: false,
        institutionEligibilityCSGD: true,
        awardEligibilityCSGD: false,

        assessmentEligibilityCSGP: false,
        institutionEligibilityCSGP: true,
        awardEligibilityCSGP: false,

        assessmentEligibilityCSLF: true,
        institutionEligibilityCSLF: true,
        awardEligibilityCSLF: true,
      },
    },
  ];
  for (const { inputData, expectedData } of appealScenarios) {
    it(
      `Should return expected award eligibility outcomes when assessment and institution eligibility rules are applied for a student ` +
        ` ${inputData.appealsFTCanadaStudentGrantEligibilityAppealData ? "with" : "without"} an approved Canada Student Grant eligibility appeal.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
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
 * for all SFA award types.
 * @param calculatedAssessment the calculated assessment model containing all
 * award eligibility variables and the institution eligibility DMN results.
 * @returns a flat object with eligibility flags for each award type at the
 * assessment, institution, and final award levels.
 */
function getEligibilityData(calculatedAssessment: CalculatedAssessmentModel) {
  return {
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
    assessmentEligibilityBCAG: calculatedAssessment.assessmentEligibilityBCAG,
    institutionEligibilityBCAG:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBCAG,
    awardEligibilityBCAG: calculatedAssessment.awardEligibilityBCAG,
    assessmentEligibilityBCAG2Year:
      calculatedAssessment.assessmentEligibilityBCAG2Year,
    // BCAG2Year is covered by dmnFullTimeAwardInstitutionEligibility.isEligibleBCAG
    awardEligibilityBCAG2Year: calculatedAssessment.awardEligibilityBCAG2Year,
    assessmentEligibilityBCSL: calculatedAssessment.assessmentEligibilityBCSL,
    institutionEligibilityBCSL:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleBCSL,
    awardEligibilityBCSL: calculatedAssessment.awardEligibilityBCSL,
    assessmentEligibilityCSGF: calculatedAssessment.assessmentEligibilityCSGF,
    institutionEligibilityCSGF:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGF,
    awardEligibilityCSGF: calculatedAssessment.awardEligibilityCSGF,
    assessmentEligibilityCSGD: calculatedAssessment.assessmentEligibilityCSGD,
    institutionEligibilityCSGD:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGD,
    awardEligibilityCSGD: calculatedAssessment.awardEligibilityCSGD,
    assessmentEligibilityCSGP: calculatedAssessment.assessmentEligibilityCSGP,
    institutionEligibilityCSGP:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSGP,
    awardEligibilityCSGP: calculatedAssessment.awardEligibilityCSGP,
    assessmentEligibilityCSLF: calculatedAssessment.assessmentEligibilityCSLF,
    institutionEligibilityCSLF:
      calculatedAssessment.dmnFullTimeAwardInstitutionEligibility
        ?.isEligibleCSLF,
    awardEligibilityCSLF: calculatedAssessment.awardEligibilityCSLF,
  };
}
