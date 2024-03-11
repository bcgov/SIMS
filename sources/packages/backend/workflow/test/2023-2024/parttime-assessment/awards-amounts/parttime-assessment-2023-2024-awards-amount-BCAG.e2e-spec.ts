import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { InstitutionTypes } from "../../../models";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-BCAG.`, () => {
  it("Should determine federalAwardBCAGAmount when calculatedDataTotalFamilyIncome <= limitAwardBCAGIncomeCap", async () => {
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
    // federalAwardBCAGAmount is 1000 (limitAwardBCAGAmount)
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardBCAGIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      43000,
    );
    expect(calculatedAssessment.variables.federalAwardBCAGAmount).toBe(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardBCAGAmount,
    );
    expect(calculatedAssessment.variables.federalAwardBCAGAmount).toBe(1000);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      700,
    );
  });

  it("Should determine federalAwardBCAGAmount, provincialAwardNetBCAGAmount when calculatedDataTotalFamilyIncome > limitAwardBCAGIncomeCap", async () => {
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
    // federalAwardBCAGAmount is less than 1000
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardBCAGIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      53000,
    );
    expect(calculatedAssessment.variables.federalAwardBCAGAmount).toBe(
      Math.max(
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardBCAGAmount -
          (calculatedAssessment.variables.calculatedDataTotalFamilyIncome -
            calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
              .limitAwardBCAGIncomeCap) *
            calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
              .limitAwardBCAGSlope,
        100,
      ),
    );
    expect(calculatedAssessment.variables.federalAwardBCAGAmount).toBeLessThan(
      1000,
    );
  });

  it("Should determine provincialAwardNetBCAGAmount when awardEligibilityBCAG is true", async () => {
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
    // awardEligibilityBCAG is true.
    // provincialAwardNetBCAGAmount is 700.
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardBCAGAmount,
    ).toBeGreaterThan(100);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      700,
    );
  });

  it("Should determine provincialAwardNetBCAGAmount as zero when awardEligibilityBCAG is false", async () => {
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
    // awardEligibilityBCAG is false
    // provincialAwardNetBCAGAmount is 0
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(0);
  });

  it("Should determine provincialAwardNetBCAGAmount when awardEligibilityBCAG is true and no BCAG awarded in the program year previously", async () => {
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
    assessmentConsolidatedData.programYearTotalPartTimeBCAG = undefined;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // awardEligibilityBCAG is true.
    // provincialAwardNetBCAGAmount is 1000.
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      1000,
    );
  });
});
