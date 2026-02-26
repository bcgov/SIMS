import { YesNoOptions } from "@sims/test-utils";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow full-time-assessment-${PROGRAM_YEAR}-costs-interface-policy.`, () => {
  it("Should show interface policy applies when a student declares income assistance of $1500 or more.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1500;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(true);
    expect(
      calculatedAssessment.variables.calculatedDataInterfaceNeed,
    ).toBeGreaterThanOrEqual(0);
  });

  it("Should show interface policy applies when a married student who declares less than $1500 income assistance and has a partner that will receive BCEA income assistance of $1500 or more.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1HasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1HasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1HasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1TotalIncome = 0;
    assessmentConsolidatedData.partner1BCEAIncomeAssistanceAmount = 1500;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(true);
    expect(
      calculatedAssessment.variables.calculatedDataInterfaceNeed,
    ).toBeGreaterThanOrEqual(0);
  });

  it("Should show interface policy does not apply when a student declares income assistance of less than $1500.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(false);
    expect(calculatedAssessment.variables.calculatedDataInterfaceNeed).toBe(
      undefined,
    );
  });

  it("Should show interface policy does not apply when a student declares no income assistance amount.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(false);
    expect(calculatedAssessment.variables.calculatedDataInterfaceNeed).toBe(
      undefined,
    );
  });

  it("Should show interface policy does not apply when a married student declares income assistance of less than $1500 and has a partner that will receive BCEA income assistance of less than $1500.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.partner1HasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1HasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1HasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1TotalIncome = 0;
    assessmentConsolidatedData.partner1BCEAIncomeAssistanceAmount = 1000;
    assessmentConsolidatedData.studentDataGovernmentFundingCosts = 100;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(false);
    expect(calculatedAssessment.variables.calculatedDataInterfaceNeed).toBe(
      undefined,
    );
  });

  it("Should calculate a lower need amount when interface policy applies.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1500;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Interface policy applies, so this should include the following costs: exceptional expenses (offering), tuition (including mandatory fees), and books and supplies (calculated).
    expect(
      calculatedAssessment.variables.calculatedDataInterfaceEducationCosts,
    ).toBe(22500);

    // Student has no eligible dependants or child care costs, so this should be 0.
    expect(
      calculatedAssessment.variables.calculatedDataInterfaceChildCareCosts,
    ).toBe(0);

    // Interface policy applies, so this should be the limit for weekly transportation costs * offering weeks.
    expect(
      calculatedAssessment.variables
        .calculatedDataInterfaceTransportationAmount,
    ).toBe(13 * 16);

    // If no additional transportation costs are provided, this should be 0.
    expect(
      calculatedAssessment.variables
        .calculatedDataInterfaceAdditionalTransportationAmount,
    ).toBe(0);

    // Interface need should be the sum of the education costs, child care costs, transportation amount, and additional transportation amount less any Government Funding.
    expect(calculatedAssessment.variables.calculatedDataInterfaceNeed).toBe(
      calculatedAssessment.variables.calculatedDataInterfaceEducationCosts +
        calculatedAssessment.variables.calculatedDataInterfaceChildCareCosts +
        calculatedAssessment.variables
          .calculatedDataInterfaceTransportationAmount +
        calculatedAssessment.variables
          .calculatedDataInterfaceAdditionalTransportationAmount -
        calculatedAssessment.variables.studentDataGovernmentFundingCosts,
    );

    // The provincial and federal assessed need should be the same as the interface need.
    expect(
      calculatedAssessment.variables.calculatedDataProvincialAssessedNeed,
    ).toBe(calculatedAssessment.variables.calculatedDataInterfaceNeed);
    expect(
      calculatedAssessment.variables.calculatedDataFederalAssessedNeed,
    ).toBe(calculatedAssessment.variables.calculatedDataInterfaceNeed);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
