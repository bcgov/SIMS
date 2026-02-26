import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakePartTimeAssessmentConsolidatedData,
  executePartTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { RelationshipStatusType } from "workflow/test/models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-appeal-eligibility-partner-current-year-income.`, () => {
  const appealEligibilityScenarios = [
    {
      studentDataRelationshipStatus: "married",
      expectedEligibility: true,
    },
    {
      studentDataRelationshipStatus: "single",
      expectedEligibility: false,
    },
    {
      studentDataRelationshipStatus: "other",
      expectedEligibility: false,
    },
    {
      studentDataRelationshipStatus: "marriedUnable",
      expectedEligibility: false,
    },
  ];
  for (const {
    studentDataRelationshipStatus,
    expectedEligibility,
  } of appealEligibilityScenarios) {
    it(`Should evaluate the partner current year income appeal as ${expectedEligibility ? "eligible" : "not eligible"} when the student is ${studentDataRelationshipStatus}.`, async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakePartTimeAssessmentConsolidatedData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus =
        studentDataRelationshipStatus as RelationshipStatusType;
      // Needed for married students
      assessmentConsolidatedData.partner1TotalIncome = 100002;
      assessmentConsolidatedData.partner1PartnerCaringForDependant =
        YesNoOptions.No;
      assessmentConsolidatedData.partner1HasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.partner1HasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.partner1HasFedralProvincialPDReceipt =
        YesNoOptions.No;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables
          .isEligibleForPartnerCurrentYearIncomeAppeal,
      ).toBe(expectedEligibility);
    });
  }
  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
