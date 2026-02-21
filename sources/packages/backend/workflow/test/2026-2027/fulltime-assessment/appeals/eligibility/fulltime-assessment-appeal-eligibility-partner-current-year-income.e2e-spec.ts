import { PROGRAM_YEAR } from "../../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-appeal-eligibility-partner-current-year-income.`, () => {
  it("Should evaluate the partner current year income appeal as eligible when the student is married.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
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
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(true);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student is single and independant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "single";
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student relationship status is other and independant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "other";
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student relationship status is unable to report and independant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "marriedUnable";
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  it("Should evaluate the partner current year income appeal as not eligible when the student is dependant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);

    assessmentConsolidatedData.studentDataDependantstatus = "dependant";
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
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables
        .isEligibleForPartnerCurrentYearIncomeAppeal,
    ).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
