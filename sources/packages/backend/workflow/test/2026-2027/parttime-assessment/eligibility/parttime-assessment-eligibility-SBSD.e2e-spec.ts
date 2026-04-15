import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";
import { Provinces } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-SBSD.`, () => {
  it(
    "Should determine SBSD as assessment eligible when total assessment need is greater than or equal to 1 and application PD/PPD status is 'yes'" +
      " and total family income is within the threshold.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
        true,
      );
    },
  );

  it("Should determine SBSD as not assessment eligible when total family income is greater than the threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
    assessmentConsolidatedData.studentDataCRAReportedIncome = 80000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
      false,
    );
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(0);
  });

  it("Should determine SBSD as not assessment eligible when application PD/PPD status is 'no'.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "no";

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
      false,
    );
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(0);
  });

  const TEST_AWARD_ELIGIBILITY = [
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        studentDataApplicationPDPPDStatus: "yes",
      },
      expectedData: {
        expectedAssessmentEligibility: true,
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: true,
      },
    },
    {
      inputData: {
        institutionCountry: "AU",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
        institutionProvince: undefined,
        studentDataApplicationPDPPDStatus: "yes",
      },
      expectedData: {
        expectedAssessmentEligibility: true,
        expectedInstitutionEligibility: false,
        expectedAwardEligibility: false,
      },
    },
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
        studentDataApplicationPDPPDStatus: "no", // Ensures that the PD status is false which makes the assessment ineligible.
      },
      expectedData: {
        expectedAssessmentEligibility: false,
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: false,
      },
    },
  ];
  for (const testEligibility of TEST_AWARD_ELIGIBILITY) {
    it(
      `Should determine SBSD as ${testEligibility.expectedData.expectedAwardEligibility ? "eligible" : "not eligible"} when the assessment is ${testEligibility.expectedData.expectedAssessmentEligibility ? "eligible" : "not eligible"} and ` +
        `institution is ${testEligibility.expectedData.expectedInstitutionEligibility ? "eligible" : "not eligible"}.`,
      async () => {
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
        expect(calculatedAssessment.variables.assessmentEligibilitySBSD).toBe(
          testEligibility.expectedData.expectedAssessmentEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnPartTimeAwardInstitutionEligibility
            .isEligibleSBSD,
        ).toBe(testEligibility.expectedData.expectedInstitutionEligibility);
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(
          testEligibility.expectedData.expectedAwardEligibility,
        );
      },
    );
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
