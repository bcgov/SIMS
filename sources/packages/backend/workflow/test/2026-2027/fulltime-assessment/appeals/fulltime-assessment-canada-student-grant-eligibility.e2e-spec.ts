import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
  getFullTimeEligibilityData,
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
        institutionEligibilityBCSL: true,
        awardEligibilityBCSL: true,

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
        institutionEligibilityBCSL: true,
        awardEligibilityBCSL: true,

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
