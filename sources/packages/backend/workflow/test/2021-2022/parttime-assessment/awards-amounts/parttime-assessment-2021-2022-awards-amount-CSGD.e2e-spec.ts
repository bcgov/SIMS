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

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSGD.`, () => {
  it("Should determine federalAwardCSGDAmount for 3 or more dependants and calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap", async () => {
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
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap
    // federalAwardCSGDAmount
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    expect(calculatedAssessment.variables.federalAwardCSGDAmount).toBe(
      Math.min(
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSGD3OrMoreChildAmount,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSGDAmount,
      ),
    );
  });

  it("Should determine federalAwardCSGDAmount, federalAwardCSGDAmount, finalFederalAwardNetCSGDAmount for 3 or more dependants and calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 42000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 42000;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
      ),
    ];
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap
    // federalAwardCSGDAmount
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    const nestedCalculation = Math.max(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD3OrMoreChildAmount -
        (calculatedAssessment.variables.calculatedDataTotalFamilyIncome -
          calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
            .limitAwardCSGDIncomeCap) *
          calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
            .limitAwardCSGD3OrMoreChildSlope,
      0,
    );
    const offeringWeeksAmount =
      Math.round(
        nestedCalculation *
          calculatedAssessment.variables.offeringWeeks *
          10000,
      ) / 10000;
    const maxComparisonCalculation = Math.max(
      offeringWeeksAmount,
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount,
    );
    expect(
      Math.round(
        calculatedAssessment.variables.federalAwardCSGDAmount * 10000,
      ) / 10000,
    ).toBe(
      Math.min(
        maxComparisonCalculation,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSGDAmount,
      ),
    );
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(
      Math.min(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed2,
        calculatedAssessment.variables.federalAwardCSGDAmount -
          assessmentConsolidatedData.programYearTotalPartTimeCSGD,
      ),
    );
    expect(
      calculatedAssessment.variables.finalFederalAwardNetCSGDAmount,
    ).toEqual(calculatedAssessment.variables.federalAwardCSGDAmount);
  });

  it("Should determine federalAwardCSGDAmount for less than 3 dependants and calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap", async () => {
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
    // federalAwardCSGDAmount
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    expect(calculatedAssessment.variables.federalAwardCSGDAmount).toBe(
      Math.min(
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSGD2OrLessChildAmount,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSGDAmount,
      ),
    );
  });

  it("Should determine federalAwardCSGDAmount, federalAwardCSGDAmount, finalFederalAwardNetCSGDAmount for less than 3 dependants and calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap", async () => {
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
    // federalAwardCSGDAmount
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    const nestedCalculation = Math.max(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount -
        (calculatedAssessment.variables.calculatedDataTotalFamilyIncome -
          calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
            .limitAwardCSGDIncomeCap) *
          calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
            .limitAwardCSGD2OrLessChildSlope,
      0,
    );
    const offeringWeeksAmount =
      Math.round(
        nestedCalculation *
          calculatedAssessment.variables.offeringWeeks *
          10000,
      ) / 10000;
    const maxComparisonCalculation = Math.max(
      offeringWeeksAmount,
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSGD2OrLessChildAmount,
    );
    expect(
      Math.round(
        calculatedAssessment.variables.federalAwardCSGDAmount * 10000,
      ) / 10000,
    ).toBe(
      Math.min(
        maxComparisonCalculation,
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSGDAmount,
      ),
    );
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(
      Math.min(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed2,
        calculatedAssessment.variables.federalAwardCSGDAmount -
          assessmentConsolidatedData.programYearTotalPartTimeCSGD,
      ),
    );
    expect(
      calculatedAssessment.variables.finalFederalAwardNetCSGDAmount,
    ).toEqual(calculatedAssessment.variables.federalAwardCSGDAmount);
  });
});
