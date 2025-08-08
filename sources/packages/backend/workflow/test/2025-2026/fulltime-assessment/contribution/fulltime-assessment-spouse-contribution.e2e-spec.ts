import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-spouse-contribution.`, () => {
  it("Should calculate total fixed student contribution for a married independent student when neither are exempt.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert

    expect(
      calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
    ).toBe(false);

    // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
    expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
      1384.6153846153845,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
    ).toBe(1847.2153846153847);
    // The total spouse contribution is not calculated for single students.
    expect(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
    ).toBe(769.9384615384616);
    // The total parental contribution is not calculated for independent students.
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentalContribution,
    ).toBe(undefined);
    // Targeted resources are scholarships and bursaries, government funding, non-government funding and voluntary parental contributions.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTargetedResources,
    ).toBe(0);
    // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalFederalContribution,
    ).toBe(2154.5538461538463);
    // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialContribution,
    ).toBe(2617.153846153846);
  });

  it("Should calculate $0 fixed student contribution for a married independent student when both are exempt.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
    expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
      1384.6153846153845,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
    ).toBe(1847.2153846153847);
    // The total spouse contribution is not calculated for single students.
    expect(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
    ).toBe(769.9384615384616);
    // The total parental contribution is not calculated for independent students.
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentalContribution,
    ).toBe(undefined);
    // Targeted resources are scholarships and bursaries, government funding, non-government funding and voluntary parental contributions.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTargetedResources,
    ).toBe(0);
    // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalFederalContribution,
    ).toBe(2154.5538461538463);
    // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialContribution,
    ).toBe(2617.153846153846);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
