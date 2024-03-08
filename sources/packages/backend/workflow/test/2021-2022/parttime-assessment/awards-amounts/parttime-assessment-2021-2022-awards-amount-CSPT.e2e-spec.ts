import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSPT.`, () => {
  it("Should determine federalAwardCSPTAmount when awardEligibilityCSPT is true and calculatedDataTotalFamilyIncome <= limitAwardCSPTIncomeCap", async () => {
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
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSPTIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      43000,
    );
    expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBe(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardCSPTAmount,
    );
    expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBe(3600);
  });

  it("Should determine federalAwardCSPTAmount when awardEligibilityCSPT is true and calculatedDataTotalFamilyIncome > limitAwardCSPTIncomeCap", async () => {
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
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardCSPTIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      53000,
    );
    expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBeLessThan(
      3000,
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
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardCSPTAmount,
    ).toBeGreaterThan(100);
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(3520);
  });

  it("Should determine federalAwardNetCSPTAmount as zero when awardEligibilityCSPT is false", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);

    assessmentConsolidatedData.studentDataCRAReportedIncome = 70001;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(false);
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(0);
  });

  it("Should determine federalAwardNetCSPTAmount when awardEligibilityCSPT is true and programYearTotalPartTimeCSPT is null", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    assessmentConsolidatedData.programYearTotalPartTimeCSPT = null;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardCSPTAmount,
    ).toBeGreaterThan(100);
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(3600);
  });
});
