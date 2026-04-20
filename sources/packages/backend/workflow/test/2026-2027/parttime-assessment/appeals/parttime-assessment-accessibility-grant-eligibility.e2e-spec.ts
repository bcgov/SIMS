import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import { InstitutionClassification } from "@sims/sims-db";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-accessibility-grant-eligibility-appeal.`, () => {
  const appealScenarios = [
    {
      inputData: {
        // The following values make the accessibility grant(SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grant(SBSD).
        // But if the application has approved accessibility grant appeal, the accessibility grant will be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        appealsPTAccessibilityGrantEligibilityAppealData: {
          isEligibilityRequested: true,
        },
      },
      expectedData: {
        assessmentSBSDEligibility: true,
        institutionSBSDEligibility: false,
        sbsdEligibility: true,
      },
    },
    {
      inputData: {
        // The following values make the accessibility grant(SBSD) eligible at assessment level.
        studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
        studentDataTaxReturnIncome: 30000,
        // BC private institutions are not eligible for the accessibility grant(SBSD).
        // The application does not have an approved accessibility grant appeal, so the accessibility grant will not be eligible.
        institutionCountry: "CA",
        institutionProvince: Provinces.BritishColumbia,
        institutionClassification: InstitutionClassification.Private,
        appealsPTAccessibilityGrantEligibilityAppealData: undefined,
      },
      expectedData: {
        assessmentSBSDEligibility: true,
        institutionSBSDEligibility: false,
        sbsdEligibility: false,
      },
    },
  ];
  for (const { inputData, expectedData } of appealScenarios) {
    it(
      `Should evaluate the accessibility grant(SBSD) as ${expectedData.sbsdEligibility ? "eligible" : "not eligible"} when the assessment eligibility is true` +
        " and the institution eligibility is false" +
        ` ${inputData.appealsPTAccessibilityGrantEligibilityAppealData ? "with" : "without"} an approved accessibility grant eligibility appeal.`,
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
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          expectedData.sbsdEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          expectedData.assessmentSBSDEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility!
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
