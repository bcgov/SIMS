import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { Provinces } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-institution-eligibility.`, () => {
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
        expectedEligibilitySBSD: true,
        expectedEligibilityBCAG: true,
        expectedEligibilityCSPT: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSLP: true,
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
        expectedEligibilitySBSD: true,
        expectedEligibilityBCAG: true,
        expectedEligibilityCSPT: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSLP: true,
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
        expectedEligibilitySBSD: false,
        expectedEligibilityBCAG: false,
        expectedEligibilityCSPT: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSLP: true,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.Alberta,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedData: {
        expectedEligibilitySBSD: false,
        expectedEligibilityBCAG: false,
        expectedEligibilityCSPT: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSLP: true,
      },
    },
    {
      inputData: {
        institutionCountry: "US",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        institutionProvince: undefined,
      },
      expectedData: {
        expectedEligibilitySBSD: false,
        expectedEligibilityBCAG: false,
        expectedEligibilityCSPT: true,
        expectedEligibilityCSGP: true,
        expectedEligibilityCSGD: true,
        expectedEligibilityCSLP: true,
      },
    },
    {
      inputData: {
        institutionCountry: "AU",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        institutionProvince: undefined,
      },
      expectedData: {
        expectedEligibilitySBSD: false,
        expectedEligibilityBCAG: false,
        expectedEligibilityCSPT: false,
        expectedEligibilityCSGP: false,
        expectedEligibilityCSGD: false,
        expectedEligibilityCSLP: false,
      },
    },
  ];
  for (const testEligibility of TEST_INSTITUTION_ELIGIBILITY) {
    it(`Should determine correct institution eligibility for all awards when the institution is ${testEligibility.inputData.institutionClassification} ${testEligibility.inputData.institutionOrganizationStatus} and located ${testEligibility.inputData.institutionCountry === "CA" ? "in " + testEligibility.inputData.institutionProvince : "out of country"}.`, async () => {
      // Arrange
      const assessmentConsolidatedData = {
        ...createFakeConsolidatedPartTimeData(PROGRAM_YEAR),
        ...testEligibility.inputData,
      };
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
          .isEligibleSBSD,
      ).toBe(testEligibility.expectedData.expectedEligibilitySBSD);
      expect(
        calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
          .isEligibleBCAG,
      ).toBe(testEligibility.expectedData.expectedEligibilityBCAG);
      expect(
        calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
          .isEligibleCSPT,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSPT);
      expect(
        calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
          .isEligibleCSGP,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSGP);
      expect(
        calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
          .isEligibleCSGD,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSGD);
      expect(
        calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
          .isEligibleCSLP,
      ).toBe(testEligibility.expectedData.expectedEligibilityCSLP);
    });
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
