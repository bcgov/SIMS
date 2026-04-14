import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentChildCareEligibility,
  DependentEligibility,
  createFakeStudentDependentEligible,
  createFakeStudentDependentEligibleForChildcareCost,
  createFakeStudentDependentNotEligible,
} from "../../../test-utils/factories";
import { Provinces, YesNoOptions } from "@sims/test-utils";
import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
} from "@sims/sims-db";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGD.`, () => {
  it("Should determine CSGD as assessment eligible when financial need is at least $1 and total family income is at or below the threshold and there is at least 1 eligible dependent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 159275;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Creates 4 eligible childcare (CSGD) dependants, 2 family-size eligible dependants, 1 fully ineligible dependant.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible12YearsAndOver,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible12YearsAndOver,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
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
    // calculatedDataTotalFamilyIncome must be at or below the threshold for
    // dmnFullTimeAwardFamilySizeVariables.limitAwardCSGDThresholdIncome.
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      assessmentConsolidatedData.studentDataTaxReturnIncome,
    );
    // Family size is calculated as the number of eligible dependants (6) plus the student.
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(7);
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildcareDependants,
    ).toBe(4);
    expect(calculatedAssessment.variables.assessmentEligibilityCSGD).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGDAmount,
    ).toBeGreaterThan(0);
  });

  it("Should determine CSGD as not assessment eligible when financial need is at least $1 and total family income is above the threshold and there is at least 1 eligible dependent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is above the threshold to force it to fail.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 100000;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.assessmentEligibilityCSGD).toBe(
      false,
    );
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(0);
  });

  it("Should determine CSGD as not assessment eligible when financial need is at least $1 and total family income is below the threshold and eligible dependents is 0.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Ensures that the income is below any threshold to force enforce the "at least one eligible dependants" rule to fail.
    assessmentConsolidatedData.studentDataTaxReturnIncome = 1000;
    // Eligible dependants for family size include dependants 18-22 attending post-secondary school.
    // Dependants eligible for CSGD must be either 0-11 years old or 12+ with a disability.
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
      ),
    ];
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.assessmentEligibilityCSGD).toBe(
      false,
    );
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(0);
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
        institutionCountry: "AU",
        institutionClassification: InstitutionClassification.Private,
        institutionOrganizationStatus: InstitutionOrganizationStatus.Profit,
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
        studentDataTaxReturnIncome: 120000, // Ensures that the income is high enough to be above the threshold for eligibility.
      },
      expectedData: {
        expectedAssessmentEligibility: false, // Above income threshold for eligibility.
        expectedInstitutionEligibility: true,
        expectedAwardEligibility: false,
      },
    },
  ];
  for (const testEligibility of TEST_AWARD_ELIGIBILITY) {
    it(
      `Should determine CSGD as ${testEligibility.expectedData.expectedAwardEligibility ? "eligible" : "not eligible"} when the assessment is ${testEligibility.expectedData.expectedAssessmentEligibility ? "eligible" : "not eligible"} and ` +
        `institution is ${testEligibility.expectedData.expectedInstitutionEligibility ? "eligible" : "not eligible"}.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData = {
          ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
          ...testEligibility.inputData,
        };
        assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
        assessmentConsolidatedData.studentDataDependants = [
          createFakeStudentDependentEligibleForChildcareCost(
            DependentChildCareEligibility.Eligible0To11YearsOld,
            assessmentConsolidatedData.offeringStudyStartDate,
          ),
        ];
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(calculatedAssessment.variables.assessmentEligibilityCSGD).toBe(
          testEligibility.expectedData.expectedAssessmentEligibility,
        );
        expect(
          calculatedAssessment.variables.dmnFullTimeAwardInstitutionEligibility
            .isEligibleCSGD,
        ).toBe(testEligibility.expectedData.expectedInstitutionEligibility);
        expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(
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
