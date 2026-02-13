import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { InstitutionTypes } from "../../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-awards-amount-BCAG.`, () => {
  it("Should determine provincialAwardBCAGAmount when calculatedDataTotalFamilyIncome <= limitAwardBCAGIncomeCap.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // provincialAwardBCAGAmount is 1000 (limitAwardBCAGAmount)
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeLessThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardBCAGIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      43000,
    );
    expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(
      calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
        .limitAwardBCAGAmount,
    );
    expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(1000);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      700,
    );
  });

  it("Should determine provincialAwardBCAGAmount, provincialAwardNetBCAGAmount when calculatedDataTotalFamilyIncome > limitAwardBCAGIncomeCap", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 33999;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // provincialAwardBCAGAmount is less than 1000
    expect(
      calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
    ).toBeGreaterThan(
      calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
        .limitAwardBCAGIncomeCap,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      54000,
    );
    expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(
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
    expect(
      calculatedAssessment.variables.provincialAwardBCAGAmount,
    ).toBeLessThan(1000);
  });

  it("Should determine provincialAwardNetBCAGAmount when awardEligibilityBCAG is true.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
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
      calculatedAssessment.variables.provincialAwardBCAGAmount,
    ).toBeGreaterThan(100);
    expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
      700,
    );
  });

  it("Should determine provincialAwardNetBCAGAmount as zero when awardEligibilityBCAG is false.", async () => {
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

  it("Should determine provincialAwardNetBCAGAmount when awardEligibilityBCAG is true and no BCAG awarded in the program year previously.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
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

  it(
    "Should determine provincialAwardNetBCAGAmount as zero when awardEligibilityBCAG is true " +
      "and difference between the programYearLimits and BCAG awarded in the program year previously is less than 100.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 20001;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
      assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
      // Public institution
      assessmentConsolidatedData.institutionType = InstitutionTypes.BCPublic;
      assessmentConsolidatedData.programYearTotalPartTimeBCAG = 901;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // awardEligibilityBCAG is true.
      // provincialAwardNetBCAGAmount is 0.
      expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
      expect(calculatedAssessment.variables.limitAwardBCAGRemaining).toBe(99);
      expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
        0,
      );
    },
  );

  it(
    "Should determine provincialAwardBCAGAmount to be 1000, provincialAwardNetBCAGAmount to be 700 when " +
      "student's current year income is 20001 and their relationship status is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.appealsStudentCurrentYearIncomeAppealData = {
        currentYearIncome: 20001,
      };
      assessmentConsolidatedData.studentDataCRAReportedIncome = 1000001;
      assessmentConsolidatedData.studentDataRelationshipStatus = "single";
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBeLessThan(
        calculatedAssessment.variables.dmnPartTimeAwardFamilySizeVariables
          .limitAwardBCAGIncomeCap,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(20001);
      expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(
        calculatedAssessment.variables.dmnPartTimeAwardAllowableLimits
          .limitAwardBCAGAmount,
      );
      expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(
        1000,
      );
      expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
        700,
      );
    },
  );

  it(
    "Should determine Net BCAG amount as remaining need when awardEligibilityBCAG is true " +
      "and remaining need is less than remaining BCAG but higher than the minimum award amount ($100).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringActualTuitionCosts = 2000;
      assessmentConsolidatedData.studentDataCRAReportedIncome = 36810;
      assessmentConsolidatedData.programYearTotalPartTimeBCAG = 150;
      assessmentConsolidatedData.offeringProgramRelatedCosts = 100;
      assessmentConsolidatedData.offeringMandatoryFees = 100;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
      expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(
        1000,
      );
      // Award limit remaining is $1000 - $150 = $850.
      expect(calculatedAssessment.variables.limitAwardBCAGRemaining).toBe(850);
      // When remaining need is less than remaining award, remaining need is used as net.
      expect(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed3,
      ).toBeLessThan(calculatedAssessment.variables.limitAwardBCAGRemaining);
      expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
        255,
      );
    },
  );

  it(
    "Should determine Net BCAG amount as remaining need when awardEligibilityBCAG is true " +
      "and remaining BCAG is less than remaining need but higher than the minimum award amount ($100).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 36810;
      assessmentConsolidatedData.programYearTotalPartTimeBCAG = 150;
      assessmentConsolidatedData.offeringCourseLoad = 20;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
      expect(calculatedAssessment.variables.provincialAwardBCAGAmount).toBe(
        1000,
      );
      // Award limit remaining is $1000 - $150 = $850.
      expect(calculatedAssessment.variables.limitAwardBCAGRemaining).toBe(850);
      // When remaining need is less than remaining award, remaining need is used as net.
      expect(
        calculatedAssessment.variables.limitAwardBCAGRemaining,
      ).toBeLessThan(
        calculatedAssessment.variables.calculatedDataTotalRemainingNeed3,
      );
      expect(calculatedAssessment.variables.provincialAwardNetBCAGAmount).toBe(
        850,
      );
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
