import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { InstitutionTypes } from "../../../models";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSPT.`, () => {
  it("Should determine awardEligibilityCSPT when calculatedDataTotalFamilyIncome <= limitAwardCSPTIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // awardEligibilityCSPT is 1000 (limitAwardCSPTAmount)
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSPTIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      43000,
    );
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSPTAmount,
    );
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(1000);
  });

  it("Should determine awardEligibilityCSPT when calculatedDataTotalFamilyIncome > limitAwardCSPTIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 32999;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // awardEligibilityCSPT is less than 1000
    console.log(calculatedAssessment.variables);
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSPTIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      53000,
    );
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(
      Math.max(
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardCSPTAmount -
          (calculatedAssessment.variables.calculatedDataTotalFamilyIncome -
            calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
              .limitAwardCSPTIncomeCap) *
            calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
              .limitAwardCSPTSlope,
        100,
      ),
    );
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBeLessThan(
      1000,
    );
  });

  it("Should determine federalAwardNetCSPTAmount when awardEligibilityCSPT is true", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    // Public institution
    assessmentConsolidatedData.institutionType = InstitutionTypes.BCPublic;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // awardEligibilityCSPT is true
    // federalAwardNetCSPTAmount is greater than 0
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBeGreaterThan(
      100,
    );
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(
      Math.min(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed1,
        Math.min(
          calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
            .limitAwardCSPTAmount,
          calculatedAssessment.variables.federalAwardCSPTAmount,
        ),
      ),
    );
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(1000);
  });

  it("Should determine federalAwardNetCSPTAmount as zero when awardEligibilityCSPT is false", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    // Private institution
    assessmentConsolidatedData.institutionType = InstitutionTypes.BCPrivate;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // awardEligibilityCSPT is false
    // federalAwardNetCSPTAmount is 0
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(false);
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(0);
  });
});
