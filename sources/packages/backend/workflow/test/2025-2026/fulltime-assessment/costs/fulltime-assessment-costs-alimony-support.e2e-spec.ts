import { YesNoOptions } from "@sims/test-utils";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow full-time-assessment-${PROGRAM_YEAR}-costs-alimony-support.`, () => {
  it(
    "Should calculate total alimony and child support costs as $0 in student application when " +
      "student does not report any alimony or child support costs " +
      "and student is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport =
        null;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(0);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(0);
    },
  );

  it(
    "Should calculate total alimony and child support costs as entered in student application when " +
      "student reports alimony and child support costs less than the maximum for their offering " +
      "and student is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport = 3500;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Maximum alimony and child support costs are $221 / week and the offering is 16 weeks.
      // So the maximum is $3536.
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(3500);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(3500);
    },
  );

  it(
    "Should calculate total alimony and child support costs when " +
      "student reports alimony and child support costs more than the maximum allowed for their offering " +
      "and student is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport = 4000;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Maximum alimony and child support costs are $221 / week and the offering is 16 weeks.
      // So the maximum is $3536.
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(3536);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(3536);
    },
  );

  it(
    "Should calculate total alimony and child support costs as entered in the application when " +
      "student reports alimony and child support costs less than the maximum for their offering " +
      "and student is married and their partner does not report any alimony or child support costs.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport = 3500;
      assessmentConsolidatedData.studentDataPartnerChildSupportCosts = null;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Maximum alimony and child support costs are $221 / week and the offering is 16 weeks.
      // So the maximum is $3536.
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(3500);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(3500);
    },
  );

  it(
    "Should calculate total alimony and child support costs as entered in the application when " +
      "the combination of student and partner alimony and child support costs are less than the maximum for the offering.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport = 2000;
      assessmentConsolidatedData.studentDataPartnerChildSupportCosts = 1000;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Maximum alimony and child support costs are $221 / week and the offering is 16 weeks.
      // So the maximum is $3536.
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(3000);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(3000);
    },
  );

  it(
    "Should calculate a reduced total alimony and child support cost when " +
      "the combination of student and partner alimony and child support costs are less than the maximum for the offering " +
      "and partner is also studying for at least 12 weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport = 2000;
      assessmentConsolidatedData.studentDataPartnerStudyWeeks = 13;
      assessmentConsolidatedData.studentDataPartnerChildSupportCosts = 1000;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Maximum alimony and child support costs are $221 / week and the offering is 16 weeks.
      // So the maximum is $3536.
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(3000);
      // If the partner is studying for more than 12 weeks, the total alimony and child support costs are reduced by half.
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(1500);
    },
  );

  it(
    "Should calculate total alimony and child support costs less than what was submitted when " +
      "the combination of student and partner alimony and child support costs are greater than the maximum for the offering.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataChildSupportAndOrSpousalSupport = 3000;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerChildSupportCosts = 2000;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Maximum alimony and child support costs are $221 / week and the offering is 16 weeks.
      // So the maximum is $3536.
      expect(
        calculatedAssessment.variables.calculatedDataChildSpousalSupport,
      ).toBe(3536);
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
      ).toBe(3536);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
