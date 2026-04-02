import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { Provinces } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-institution-eligibility.`, () => {
  const TEST_INSTITUTION_ELIGIBILITY = [
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedEligibilityBCAG: true,
        expectedEligibilityBGPD: true,
        expectedEligibilitySBSD: true,
        expectedEligibilityBCSL: true,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit, // It is assumed all publics are not-for-profit, but this is to ensure that the organization status does not impact the eligibility.
      },
      expectedData: {
        expectedEligibilityBCAG: true,
        expectedEligibilityBGPD: true,
        expectedEligibilitySBSD: true,
        expectedEligibilityBCSL: true,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: false,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: false,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: false,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.Ontario,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: false,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.Manitoba,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: false,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.Alberta,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: false,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: false,
      },
    },
    {
      inputData: {
        institutionCountry: "US",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: true,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionCountry: "AU",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: true,
        expectedEligibilityCSLF: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSGF: true,
      },
    },
    {
      inputData: {
        institutionCountry: "AT",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedData: {
        expectedEligibilityBCAG: false,
        expectedEligibilityBGPD: false,
        expectedEligibilitySBSD: false,
        expectedEligibilityBCSL: false,
        expectedEligibilityCSLF: false,
        expectedEligibilityCSGP: false,
        expectedEligibilityCSGD: false,
        expectedEligibilityCSGF: false,
      },
    },
  ];
  for (const testEligibility of TEST_INSTITUTION_ELIGIBILITY) {
    it(`Should determine correct institution eligibility for all awards when the institution is ${testEligibility.inputData.institutionClassification} ${testEligibility.inputData.institutionOrganizationStatus} and located ${testEligibility.inputData.institutionCountry === "CA" ? "in " + testEligibility.inputData.institutionProvince : "out of country"}.`, async () => {
      // Arrange
      const assessmentConsolidatedData = {
        ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
        ...testEligibility.inputData,
      };
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleBCSL,
      ).toBe(testEligibility.expectedData.expectedEligibilityBCSL);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleCSLF,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSLF);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleCSGP,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSGP);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleCSGD,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSGD);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleCSGF,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSGF);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleBCAG,
      ).toBe(testEligibility.expectedData.expectedEligibilityBCAG);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleSBSD,
      ).toBe(testEligibility.expectedData.expectedEligibilitySBSD);
      expect(
        calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
          .isEligibleBGPD,
      ).toBe(testEligibility.expectedData.expectedEligibilityBGPD);
    });
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
