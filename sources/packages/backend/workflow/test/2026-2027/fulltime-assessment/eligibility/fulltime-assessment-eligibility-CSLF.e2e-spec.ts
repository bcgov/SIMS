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

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSLF.`, () => {
  it("Should determine CSLF as assessment eligible when federal need is at least $1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataFederalAssessedNeed,
    ).toBeGreaterThan(0);
    expect(calculatedAssessment.variables.assessmentEligibilityCSLF).toBe(true);
  });

  it("Should determine CSLF as not assessment eligible when federal need is less than $1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is high enough to eliminate any federal need.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 500000;
    assessmentConsolidatedData.offeringWeeks = 5;
    assessmentConsolidatedData.offeringProgramRelatedCosts = 30;
    assessmentConsolidatedData.offeringActualTuitionCosts = 50;
    assessmentConsolidatedData.studentDataVoluntaryContributions = 10000;
    assessmentConsolidatedData.institutionLocationProvince =
      Provinces.NewFoundlandAndLabrador;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataFederalAssessedNeed,
    ).toBeLessThan(1);
    expect(calculatedAssessment.variables.assessmentEligibilityCSLF).toBe(
      false,
    );
    expect(calculatedAssessment.variables.finalFederalAwardNetCSLFAmount).toBe(
      0,
    );
  });

  const TEST_AWARD_ELIGIBILITY = [
    {
      inputData: {
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
        institutionClassification: InstitutionClassification.Public,
        institutionOrganizationStatus:
          InstitutionOrganizationStatus.NotForProfit,
      },
      expectedData: {
        expectedAssessmentEligibility: true,
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: true,
      },
    },
    {
      inputData: {
        institutionProvince: undefined,
        institutionCountry: "AT",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
      },
      expectedData: {
        expectedAssessmentEligibility: true, // Need > $1
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
        studentDataTaxReturnIncome: 500000, // Ensures that the income is high enough to eliminate any federal need.
        offeringWeeks: 5,
        offeringProgramRelatedCosts: 30,
        offeringActualTuitionCosts: 50,
        studentDataVoluntaryContributions: 10000,
        institutionLocationProvince: Provinces.NewFoundlandAndLabrador,
      },
      expectedData: {
        expectedAssessmentEligibility: false, // Need < $1
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: false,
      },
    },
  ];
  for (const testEligibility of TEST_AWARD_ELIGIBILITY) {
    it(
      `Should determine CSLF as ${testEligibility.expectedData.expectedAwardEligibility ? "eligible" : "not eligible"} when the assessment is ${testEligibility.expectedData.expectedAssessmentEligibility ? "eligible" : "not eligible"} and ` +
        `institution is ${testEligibility.expectedData.expectedInstitutionEligibility ? "eligible" : "not eligible"}.`,
      async () => {
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
        expect(calculatedAssessment.variables.assessmentEligibilityCSLF).toBe(
          testEligibility.expectedData.expectedAssessmentEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
            .isEligibleCSLF,
        ).toBe(testEligibility.expectedData.expectedInstitutionEligibility);
        expect(calculatedAssessment.variables.awardEligibilityCSLF).toBe(
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
