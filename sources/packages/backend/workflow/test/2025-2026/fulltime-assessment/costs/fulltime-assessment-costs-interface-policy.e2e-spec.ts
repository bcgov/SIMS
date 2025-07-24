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
  });

  it("Should show interface policy applies when a married student who declares less than $1500 income assistance and has a partner that will receive BCEA income assistance of $1500 or more.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
    assessmentConsolidatedData.studentDataPartnerBCEAIncomeAssistanceAmount = 1500;

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
  });

  it("Should show interface policy does not apply when a married student declares income assistance of less than $1500 and has a partner that will receive BCEA income assistance of less than $1500.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIncomeAssistanceAmount = 1000;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
    assessmentConsolidatedData.studentDataPartnerBCEAIncomeAssistanceAmount = 1000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataInterfacePolicyApplies,
    ).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
