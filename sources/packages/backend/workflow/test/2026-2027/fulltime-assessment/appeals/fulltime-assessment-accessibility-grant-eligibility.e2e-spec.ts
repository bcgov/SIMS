import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import { InstitutionClassification } from "@sims/sims-db";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-accessibility-grant-eligibility-appeal.`, () => {
  const appealScenarios = [
    {
      inputData: {
        // The following values make the accessibility grants (BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grants (BGPD, SBSD)).
        // But if the application has approved accessibility grant appeal, the accessibility grant will be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        appealsFTAccessibilityGrantEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentBGPDEligibility: true,
        assessmentSBSDEligibility: true,
        institutionBGPDEligibility: false,
        institutionSBSDEligibility: false,
        bgpdEligibility: true,
        sbsdEligibility: true,
      },
    },
    {
      inputData: {
        // The following values make the accessibility grants (BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grants (BGPD, SBSD)).
        // The application does not have an approved accessibility grant appeal, so the accessibility grant will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        appealsFTAccessibilityGrantEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentBGPDEligibility: true,
        assessmentSBSDEligibility: true,
        institutionBGPDEligibility: false,
        institutionSBSDEligibility: false,
        bgpdEligibility: false,
        sbsdEligibility: false,
      },
    },
    {
      inputData: {
        // The following values make the accessibility grants (BGPD, SBSD) ineligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.No,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grants (BGPD, SBSD)).
        // The application does not have an approved accessibility grant appeal, so the accessibility grant will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        appealsFTAccessibilityGrantEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentBGPDEligibility: false,
        assessmentSBSDEligibility: false,
        institutionBGPDEligibility: false,
        institutionSBSDEligibility: false,
        bgpdEligibility: false,
        sbsdEligibility: false,
      },
    },
    {
      inputData: {
        // The following values make the accessibility grants (BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // OOP public institutions are not eligible for the accessibility grants (BGPD, SBSD)).
        // But if the application has approved accessibility grant appeal, the accessibility grant will be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Alberta,
        institutionClassification: InstitutionClassification.Public,
        appealsFTAccessibilityGrantEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentBGPDEligibility: true,
        assessmentSBSDEligibility: true,
        institutionBGPDEligibility: false,
        institutionSBSDEligibility: false,
        bgpdEligibility: true,
        sbsdEligibility: true,
      },
    },
    {
      inputData: {
        // The following values make the accessibility grants (BGPD, SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // OOP public institutions are not eligible for the accessibility grants (BGPD, SBSD)).
        // The application does not have an approved accessibility grant appeal, so the accessibility grant will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.Alberta,
        institutionClassification: InstitutionClassification.Public,
        appealsFTAccessibilityGrantEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentBGPDEligibility: true,
        assessmentSBSDEligibility: true,
        institutionBGPDEligibility: false,
        institutionSBSDEligibility: false,
        bgpdEligibility: false,
        sbsdEligibility: false,
      },
    },
  ];
  for (const { inputData, expectedData } of appealScenarios) {
    it(
      `Should evaluate the accessibility grants (BGPD, SBSD) as ${expectedData.bgpdEligibility ? "eligible" : "not eligible"} and ${expectedData.sbsdEligibility ? "eligible" : "not eligible"} when the assessment eligibility is true` +
        " and the institution eligibility is false" +
        ` ${inputData.appealsFTAccessibilityGrantEligibilityAppealData ? "with" : "without"} an approved accessibility grant eligibility appeal.`,
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

        // Assert
        expect(calculatedAssessment.variables.awardEligibilityBGPD).toBe(
          expectedData.bgpdEligibility,
        );
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          expectedData.sbsdEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilityBGPD).toBe(
          expectedData.assessmentBGPDEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          expectedData.assessmentSBSDEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleBGPD,
        ).toBe(expectedData.institutionBGPDEligibility);
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleSBSD,
        ).toBe(expectedData.institutionSBSDEligibility);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
