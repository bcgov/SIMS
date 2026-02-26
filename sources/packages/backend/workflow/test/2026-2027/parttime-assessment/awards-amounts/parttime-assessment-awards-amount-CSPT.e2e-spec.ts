import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-CSPT.`, () => {
  it("Should determine federalAwardCSPTAmount when awardEligibilityCSPT is true and calculatedDataTotalFamilyIncome <= limitAwardCSPTIncomeCap.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
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
    expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBe(2520);
  });

  it("Should determine federalAwardCSPTAmount when awardEligibilityCSPT is true and calculatedDataTotalFamilyIncome > limitAwardCSPTIncomeCap.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1CRAReportedIncome = 33999;
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
      54000,
    );
    expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBeLessThan(
      3000,
    );
  });

  it("Should determine federalAwardNetCSPTAmount when awardEligibilityCSPT is true.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
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
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(2440);
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

  it("Should determine federalAwardNetCSPTAmount when awardEligibilityCSPT is true and no CSPT awarded in the program year previously.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    assessmentConsolidatedData.programYearTotalPartTimeCSPT = undefined;
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
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(2520);
  });

  it("Should determine federalAwardNetCSPTAmount as zero when awardEligibilityCSPT is true and difference between the programYearLimits and CSPT awarded in the program year previously is less than 100.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 60001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    assessmentConsolidatedData.programYearTotalPartTimeCSPT = 795;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
    expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBe(
      804.617856,
    );
    // Award limit remaining is $804.617856 - $795 = $9.617856 which is less than $100.
    expect(calculatedAssessment.variables.limitAwardCSPTRemaining).toBeLessThan(
      100,
    );
    expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(0);
  });

  it(
    "Should determine Net CSPT amount as the lower of remaining CSPT and remaining need when awardEligibilityCSPT is true, " +
      "both are over the minimum award amount ($100) and student has max award amount based on income.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 37700;
      assessmentConsolidatedData.programYearTotalPartTimeCSPT = 1000;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
      expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBe(2520);
      // Award limit remaining is $2520 - $1,000 = $1,520
      expect(calculatedAssessment.variables.limitAwardCSPTRemaining).toBe(1520);
      // When remaining award is less than remaining need, remaining award is used as net.
      expect(
        calculatedAssessment.variables.limitAwardCSPTRemaining,
      ).toBeLessThan(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed1,
      );
      expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(
        calculatedAssessment.variables.limitAwardCSPTRemaining,
      );
    },
  );

  it(
    "Should determine Net CSPT amount as remaining need when awardEligibilityCSPT is true " +
      "and remaining need is less than remaining CSPT but higher than the minimum award amount ($100).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringActualTuitionCosts = 500;
      assessmentConsolidatedData.offeringMandatoryFees = 100;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 200;
      assessmentConsolidatedData.studentDataCRAReportedIncome = 36810;
      assessmentConsolidatedData.programYearTotalPartTimeCSPT = 150;
      assessmentConsolidatedData.offeringCourseLoad = 30;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
      expect(calculatedAssessment.variables.federalAwardCSPTAmount).toBe(2520);
      // Award limit remaining is $2520 - $150 = $2370.
      expect(calculatedAssessment.variables.limitAwardCSPTRemaining).toBe(2370);
      // When remaining need is less than remaining award, remaining need is used as net.
      expect(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed1,
      ).toBeLessThan(calculatedAssessment.variables.limitAwardCSPTRemaining);
      // Need should be tuition ($500) + fees ($100) + program related costs ($200) + transportation ($13 x 15 weeks) + miscellaneous ($10 x 15 weeks)
      expect(calculatedAssessment.variables.federalAwardNetCSPTAmount).toBe(
        1145,
      );
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
