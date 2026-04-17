import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import { InstitutionClassification } from "@sims/sims-db";

// TODO Incorporate BCPD assertions
describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-accessibility-grant-eligibility-appeal.`, () => {
  const appealScenarios = [
    {
      // The following values make the accessibility grant(SBSD) eligible at assessment level.
      studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
      studentDataTaxReturnIncome: 30000,
      // BC private institutions are not eligible for the accessibility grant(SBSD).
      // But if the application has approved accessibility grant appeal, the accessibility grant will be eligible.
      institutionCountry: "CA",
      institutionProvince: Provinces.BritishColumbia,
      institutionClassification: InstitutionClassification.Private,
      appealsFTAccessibilityGrantEligibilityAppealData: {
        isEligibilityRequested: true,
      },
      expectedAssessmentSBSDEligibility: true,
      expectedInstitutionSBSDEligibility: false,
      expectedSBSDEligibility: true,
    },
    {
      // The following values make the accessibility grant(SBSD) eligible at assessment level.
      studentDataApplicationPDPPDStatus: YesNoOptions.Yes,
      studentDataTaxReturnIncome: 30000,
      // BC private institutions are not eligible for the accessibility grant(SBSD).
      // The application does not have an approved accessibility grant appeal, so the accessibility grant will not be eligible.
      institutionCountry: "CA",
      institutionProvince: Provinces.BritishColumbia,
      institutionClassification: InstitutionClassification.Private,
      appealsFTAccessibilityGrantEligibilityAppealData: undefined,
      expectedAssessmentSBSDEligibility: true,
      expectedInstitutionSBSDEligibility: false,
      expectedSBSDEligibility: false,
    },
  ];
  for (const {
    studentDataApplicationPDPPDStatus,
    studentDataTaxReturnIncome,
    institutionCountry,
    institutionProvince,
    institutionClassification,
    appealsFTAccessibilityGrantEligibilityAppealData,
    expectedAssessmentSBSDEligibility,
    expectedInstitutionSBSDEligibility,
    expectedSBSDEligibility,
  } of appealScenarios) {
    it(
      `Should evaluate the accessibility grant(SBSD) as ${expectedSBSDEligibility ? "eligible" : "not eligible"} when the assessment eligibility is true` +
        " and the institution institution eligibility is false" +
        ` ${appealsFTAccessibilityGrantEligibilityAppealData ? "with" : "without"} an approved accessibility grant eligibility appeal.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
        assessmentConsolidatedData.studentDataApplicationPDPPDStatus =
          studentDataApplicationPDPPDStatus;
        // Needed for married students
        assessmentConsolidatedData.studentDataTaxReturnIncome =
          studentDataTaxReturnIncome;
        assessmentConsolidatedData.institutionCountry = institutionCountry;
        assessmentConsolidatedData.institutionProvince = institutionProvince;
        assessmentConsolidatedData.institutionClassification =
          institutionClassification;
        assessmentConsolidatedData.appealsFTAccessibilityGrantEligibilityAppealData =
          appealsFTAccessibilityGrantEligibilityAppealData;
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          expectedSBSDEligibility,
        );
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          expectedAssessmentSBSDEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility!
            .isEligibleSBSD,
        ).toBe(expectedInstitutionSBSDEligibility);
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
