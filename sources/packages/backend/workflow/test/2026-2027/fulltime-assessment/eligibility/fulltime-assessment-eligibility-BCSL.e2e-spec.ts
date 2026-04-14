import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
  createFakeStudentDependentNotEligible,
} from "../../../test-utils/factories";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-BCSL.`, () => {
  it("Should determine BCSL as assessment eligible when provincial need is at least $1.", async () => {
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
      calculatedAssessment.variables.calculatedDataProvincialAssessedNeed,
    ).toBeGreaterThan(0);
    expect(calculatedAssessment.variables.assessmentEligibilityBCSL).toBe(true);
  });

  it("Should determine BCSL as not assessment eligible when provincial need is less than $1.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is high enough to eliminate any provincial need.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 500000;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataProvincialAssessedNeed,
    ).toBeLessThan(1);
    expect(calculatedAssessment.variables.assessmentEligibilityBCSL).toBe(
      false,
    );
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCSLAmount,
    ).toBe(0);
  });

  it("Should determine BC(SL) Top Up as eligible when eligible dependants is greater than 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Eligible dependants include dependants 18-22 attending post-secondary school, 0-18 years old and >22 if declared on taxes.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(1);
    expect(calculatedAssessment.variables.awardEligibilityBCTopUp).toBe(true);
  });

  it("Should determine BC(SL) Top Up as not eligible when eligible dependants is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Eligible dependants include dependants 18-22 attending post-secondary school, 0-18 years old and >22 if declared on taxes.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentNotEligible(
        DependentEligibility.EligibleOver22YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(0);
    expect(calculatedAssessment.variables.awardEligibilityBCTopUp).toBe(false);
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
        institutionProvince: Provinces.BritishColumbia,
        institutionCountry: "CA",
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
        studentDataTaxReturnIncome: 500000, // Ensures that the income is high enough to eliminate any provincial need.
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
      `Should determine BCSL as ${testEligibility.expectedData.expectedAwardEligibility ? "eligible" : "not eligible"} when the assessment is ${testEligibility.expectedData.expectedAssessmentEligibility ? "eligible" : "not eligible"} and ` +
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
        expect(calculatedAssessment.variables.assessmentEligibilityBCSL).toBe(
          testEligibility.expectedData.expectedAssessmentEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
            .isEligibleBCSL,
        ).toBe(testEligibility.expectedData.expectedInstitutionEligibility);
        expect(calculatedAssessment.variables.awardEligibilityBCSL).toBe(
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
