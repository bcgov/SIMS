import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { ProgramLengthOptions } from "../../../models";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-awards-amount-BCAG.`, () => {
  it("Should determine $0 Weekly BCAG Max Amount when student is not eligible for BCAG or BCAG 2 Year.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 79719; // Above the BCAG income cap for single student

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
    expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(
      false,
    );
    expect(calculatedAssessment.variables.provincialAwardWeeklyBCAGMax).toBe(0);
    // The provincialAwardBCAGAmount is a sloped calculation amount based on family income.
    // If it's above the threshold for eligibility it will result in $0 or a negative number.
    expect(
      calculatedAssessment.variables.provincialAwardBCAGAmount,
    ).toBeLessThanOrEqual(0);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(0);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
    ).toBe(0);
  });

  it("Should determine the correct weekly amount when student is eligible for BCAG (not 2 year) and is below income threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 36810; // Below the BCAG income threshold for single student
    assessmentConsolidatedData.programLength =
      ProgramLengthOptions.TwelveWeeksToFiftyTwoWeeks;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
    expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(
      false,
    );
    expect(calculatedAssessment.variables.provincialAwardWeeklyBCAGMax).toBe(
      29.4118,
    );
    // The provincialAwardBCAGAmount is calculated as: weekly amount * number of weeks.
    // 29.4118 * 34 weeks = 1000
    expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(1000);
    // The provincialAwardNetBCAGAmount is calculated as the lesser of provincialAwardBCAGAmount or the minimum BCAG award amount.
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      calculatedAssessment.variables.provincialAwardBCAGAmount,
    );
    // Exact amount after other award amounts can impact the final BCAG amount.
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
    ).toBeGreaterThan(0);
  });

  it("Should determine the correct weekly amount when student is eligible for BCAG 2 Year and is below income threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataTaxReturnIncome = 36810; // Below the BCAG income threshold for single student

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
    expect(calculatedAssessment.variables.awardEligibilityBCAG2Year).toBe(true);
    expect(calculatedAssessment.variables.provincialAwardWeeklyBCAGMax).toBe(
      117.6471,
    );
    // The provincialAwardBCAGAmount is calculated as: weekly amount * number of weeks.
    // 117.6471 * 34 weeks = 4000
    expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(4000);
    // The provincialAwardNetBCAGAmount is calculated as the lesser of provincialAwardBCAGAmount or the minimum BCAG award amount.
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      calculatedAssessment.variables.provincialAwardBCAGAmount,
    );
    // Exact amount after other award amounts can impact the final BCAG amount.
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
    ).toBeGreaterThan(0);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
