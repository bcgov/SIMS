import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  DependentEligibility,
  createFakeStudentDependentBornAfterStudyEndDate,
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
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 20000;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
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
    expect(calculatedAssessment.variables.federalAwardCSGDAmount).toBe(1800);
  });

  it("Should determine federalAwardCSGDAmount for 3 or more dependants and calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 42000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 42000;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
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
      1201.20448,
    );
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      1201.20448,
    );
  });

  it("Should determine federalAwardCSGDAmount for less than 3 dependants and calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 20000;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      // Dependent(s) born after study end date are not considered
      // as eligible for any calculation.
      createFakeStudentDependentBornAfterStudyEndDate(
        assessmentConsolidatedData.offeringStudyEndDate,
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
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(2);
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSGDIncomeCap,
    );
    expect(calculatedAssessment.variables.federalAwardCSGDAmount).toBe(1200);
  });

  it("Should determine federalAwardCSGDAmount for less than 3 dependants and calculatedDataTotalFamilyIncome > limitAwardCSGDIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 35000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 35000;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
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
      659.0567998,
    );
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      659.0567998,
    );
  });

  it("Should determine federalAwardCSGDAmount when awardEligibilityCSGD is true and no CSGD awarded in the program year previously", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 35000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 35000;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    assessmentConsolidatedData.programYearTotalPartTimeCSGD = undefined;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // calculatedDataTotalFamilyIncome <= limitAwardCSGDIncomeCap
    // federalAwardCSGDAmount
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(true);
    expect(calculatedAssessment.variables.federalAwardCSGDAmount).toBe(
      859.0567998,
    );
    expect(calculatedAssessment.variables.federalAwardNetCSGDAmount).toBe(
      859.0567998,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
