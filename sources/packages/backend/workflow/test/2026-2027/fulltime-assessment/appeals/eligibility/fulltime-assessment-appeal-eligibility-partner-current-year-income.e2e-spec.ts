import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import {
  DependantStatusType,
  RelationshipStatusType,
} from "workflow/test/models";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-partner-current-year-income.`, () => {
  const appealEligibilityScenarios = [
    {
      studentDataRelationshipStatus: "married",
      dependantStatus: "independent",
      expectedEligibility: true,
    },
    {
      studentDataRelationshipStatus: "single",
      dependantStatus: "independent",
      expectedEligibility: false,
    },
    {
      studentDataRelationshipStatus: "single",
      dependantStatus: "dependant",
      expectedEligibility: false,
    },
    {
      studentDataRelationshipStatus: "other",
      dependantStatus: "independent",
      expectedEligibility: false,
    },
    {
      studentDataRelationshipStatus: "marriedUnable",
      dependantStatus: "independent",
      expectedEligibility: false,
    },
  ];
  for (const {
    studentDataRelationshipStatus,
    dependantStatus,
    expectedEligibility,
  } of appealEligibilityScenarios) {
    it(`Should evaluate the partner current year income appeal as ${expectedEligibility ? "eligible" : "not eligible"} when the student is ${studentDataRelationshipStatus}.`, async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus =
        studentDataRelationshipStatus as RelationshipStatusType;
      assessmentConsolidatedData.studentDataDependantStatus =
        dependantStatus as DependantStatusType;
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
      // Need for dependant students
      assessmentConsolidatedData.parent1TotalIncome = 99999;
      assessmentConsolidatedData.parent1CppEmployment = 500;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 200;
      assessmentConsolidatedData.parent1Ei = 600;
      assessmentConsolidatedData.parent1Tax = 700;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
          parentIsAbleToReport: YesNoOptions.Yes,
        },
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
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
