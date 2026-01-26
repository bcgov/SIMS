import {
  ZeebeMockedClient,
  createFakeAssessmentConsolidatedData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}.`, () => {
  it("Should not apply interface policy when a single, independent student does not qualify for interface policy.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringStudyStartDate = `${PROGRAM_YEAR}-02-01`;
    assessmentConsolidatedData.offeringStudyEndDate = `${PROGRAM_YEAR}-05-24`;
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 10; // Student is receiving income assistance below the threshold.
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

  it("Should apply interface policy when a single, independent student does qualify for interface policy.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringStudyStartDate = `${PROGRAM_YEAR}-02-01`;
    assessmentConsolidatedData.offeringStudyEndDate = `${PROGRAM_YEAR}-05-24`;
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1500; // Student is receiving income assistance above the threshold.
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

  it("Should not apply interface policy when a married student does not qualify for interface policy.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;

    // Student and partner income assistance values for Interface Policy check.
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 50; // Student is receiving income assistance below the threshold.
    assessmentConsolidatedData.studentDataPartnerBCEAIncomeAssistanceAmount = 50; // Partner is receiving income assistance below the threshold.
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

  it("Should apply interface policy when a married student does qualify for interface policy based on their income assistance amount.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;

    // Student and partner income assistance values for Interface Policy check.
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1500; // Student is receiving income assistance above the threshold.
    assessmentConsolidatedData.studentDataPartnerBCEAIncomeAssistanceAmount = 50; // Partner is receiving income assistance below the threshold.
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

  it("Should apply interface policy when a married student does qualify for interface policy based on their spouse's income assistance amount.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;

    // Student and partner income assistance values for Interface Policy check.
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 50; // Student is receiving income assistance below the threshold.
    assessmentConsolidatedData.studentDataPartnerBCEAIncomeAssistanceAmount = 1500; // Partner is receiving income assistance above the threshold.
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(true);
  });

  it.only("Should apply interface policy need when a single student qualifies for interface policy.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1500; // Student is receiving income assistance above the threshold.
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(true);

    // Education costs for interface policy is the sum of exceptional expenses, tuition and book costs.
    expect(
      calculatedAssessment.variables.calculatedDataInterfaceEducationCosts,
    ).toBe(
      calculatedAssessment.variables.calculatedDataExceptionalExpenses +
        calculatedAssessment.variables.calculatedDataTotalTutionCost +
        calculatedAssessment.variables.calculatedDataTotalBookCost,
    );

    // Non-educational costs for interface policy include child care costs, transportation and additional transportation costs.
    expect(
      calculatedAssessment.variables.calculatedDataInterfaceChildCareCosts,
    ).toBe(calculatedAssessment.variables.calculatedDataTotalChildCareCost);
    // No additional transportation requested, so amount is $0.
    expect(
      calculatedAssessment.variables
        .calculatedDataInterfaceAdditionalTransportationAmount,
    ).toBe(0);
    // Transportation costs calculation: 16 weeks * $13 (amount per week).
    expect(
      calculatedAssessment.variables
        .calculatedDataInterfaceTransportationAmount,
    ).toBe(13 * 16);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
