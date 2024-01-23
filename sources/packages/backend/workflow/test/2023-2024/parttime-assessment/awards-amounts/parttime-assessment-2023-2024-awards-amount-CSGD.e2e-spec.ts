import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSGD for 3 or more dependants.`, () => {
  it("Should determine federalAwardCSGDAmount when calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 20000;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    const offeringWeeksAmount =
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD3OrMoreChildAmount *
      calculatedAssessment.variables.offeringWeeks;
    const maxComparisonCalculation = Math.max(
      offeringWeeksAmount,
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD3OrMoreChildAmount,
    );
    expect(maxComparisonCalculation).toBe(offeringWeeksAmount);
    expect(maxComparisonCalculation).toBe(1260);
    expect(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSPTAmount,
    ).toBe(2520);
    expect(
      Math.min(
        maxComparisonCalculation,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSPTAmount,
      ),
    ).toBe(maxComparisonCalculation);
  });

  it("Should determine federalAwardCSGDAmount when calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 35000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 35000;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    const nestedCalculation =
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD3OrMoreChildAmount -
      (calculatedAssessment.variables.calculatedDataTotalFamilyIncome -
        calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
          .limitAwardCSGDIncomeCap) *
        calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
          .limitAwardCSGD3OrMoreChildSlope;
    expect(nestedCalculation).toBeGreaterThan(0);
    expect(Math.max(nestedCalculation, 0)).toBe(nestedCalculation);
    const offeringWeeksAmount =
      Math.max(nestedCalculation, 0) *
      calculatedAssessment.variables.offeringWeeks;
    const maxComparisonCalculation = Math.max(
      offeringWeeksAmount,
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD3OrMoreChildAmount,
    );
    expect(maxComparisonCalculation).toBe(offeringWeeksAmount);
    expect(maxComparisonCalculation).toBe(1260);
    expect(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSPTAmount,
    ).toBe(2520);
    expect(
      Math.min(
        maxComparisonCalculation,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSPTAmount,
      ),
    ).toBe(maxComparisonCalculation);
  });
});

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSGD for less than 3 dependants.`, () => {
  it("Should determine federalAwardCSGDAmount when calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 20000;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    const offeringWeeksAmount =
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount *
      calculatedAssessment.variables.offeringWeeks;
    const maxComparisonCalculation = Math.max(
      offeringWeeksAmount,
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount,
    );
    expect(maxComparisonCalculation).toBe(offeringWeeksAmount);
    expect(maxComparisonCalculation).toBe(840);
    expect(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSPTAmount,
    ).toBe(2520);
    expect(
      Math.min(
        maxComparisonCalculation,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSPTAmount,
      ),
    ).toBe(maxComparisonCalculation);
  });

  it("Should determine federalAwardCSGDAmount when calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 30000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 30000;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    const nestedCalculation =
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount -
      (calculatedAssessment.variables.calculatedDataTotalFamilyIncome -
        calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
          .limitAwardCSGDIncomeCap) *
        calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
          .limitAwardCSGD2OrLessChildSlope;
    expect(nestedCalculation).toBeGreaterThan(0);
    expect(Math.max(nestedCalculation, 0)).toBe(nestedCalculation);
    const offeringWeeksAmount =
      Math.max(nestedCalculation, 0) *
      calculatedAssessment.variables.offeringWeeks;
    const maxComparisonCalculation = Math.max(
      offeringWeeksAmount,
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount,
    );
    expect(maxComparisonCalculation).toBe(offeringWeeksAmount);
    expect(maxComparisonCalculation).toBeLessThan(840);
    expect(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSPTAmount,
    ).toBe(2520);
    expect(
      Math.min(
        maxComparisonCalculation,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSPTAmount,
      ),
    ).toBe(maxComparisonCalculation);
  });
});
