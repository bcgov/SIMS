import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions, YesNoOptions } from "@sims/test-utils";
import {
  DependentChildCareEligibility,
  createFakeStudentDependentEligibleForChildcareCost,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-costs-non-educational.`, () => {
  it("Should determine the total non-educational costs when the student only has living allowances costs.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Return transportation and additional transportation costs should be included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataReturnTripHomeCost = null;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Exceptional expenses are included in the non-educational costs calculation.
    assessmentConsolidatedData.appealsExceptionalExpenseAppealData = null;
    // Second Residence costs are included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataLivingWithPartner = YesNoOptions.Yes;
    // Child care costs are included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataChildCareCosts = undefined;
    // Child support and spousal support are included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataChildSpousalSupportCost = null;
    // Partner fields that impact non-educational costs.
    assessmentConsolidatedData.partner1TotalStudentLoan = undefined;
    assessmentConsolidatedData.partner1PartnerCaringForDependant = undefined;
    assessmentConsolidatedData.partner1ChildSpousalSupportCost = undefined;
    assessmentConsolidatedData.partner1StudentStudyWeeks = undefined;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(9008);
    // No other values should be added to the total non-educational costs calculation, so it should be equal to the total MSOL allowance.
    expect(
      calculatedAssessment.variables.calculatedDataTotalNonEducationalCost,
    ).toBe(calculatedAssessment.variables.calculatedDataTotalMSOLAllowance);
  });

  it("Should determine the total non-educational costs when the student has all possible non-educational costs.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);

    assessmentConsolidatedData.studentDataDependantstatus = "independant";
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    // Return transportation and additional transportation costs should be included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataReturnTripHomeCost = 500;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportOwner =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportKm = 200;
    assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
    assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
      YesNoOptions.No;
    assessmentConsolidatedData.offeringDelivered =
      OfferingDeliveryOptions.Onsite;
    // Exceptional expenses are included in the non-educational costs calculation.
    assessmentConsolidatedData.appealsExceptionalExpenseAppealData = {
      exceptionalExpenseAmount: 1000,
    };
    // Second Residence costs are included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataLivingWithPartner = YesNoOptions.No;
    // Child care costs are included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 3000;
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligibleForChildcareCost(
        DependentChildCareEligibility.Eligible0To11YearsOld,
        assessmentConsolidatedData.offeringStudyStartDate,
      ),
    ];
    // Child support and spousal support are included in the non-educational costs calculation.
    assessmentConsolidatedData.studentDataChildSpousalSupportCost = 2000;
    // Partner fields that impact non-educational costs.
    assessmentConsolidatedData.partner1TotalStudentLoan = 4000;
    assessmentConsolidatedData.partner1PartnerCaringForDependant =
      YesNoOptions.No;
    assessmentConsolidatedData.partner1ChildSpousalSupportCost = 500;
    assessmentConsolidatedData.partner1StudentStudyWeeks = 0;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildCareCost,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.calculatedDataTotalSecondResidence,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.calculatedDataPartnerStudentLoans,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.calculatedDataExceptionalCosts,
    ).toBeGreaterThan(0);
    // The total non-educational costs should be the sum of all the individual non-educational costs.
    expect(
      calculatedAssessment.variables.calculatedDataTotalNonEducationalCost,
    ).toBe(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance +
        calculatedAssessment.variables.calculatedDataTotalTransportationCost +
        calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport +
        calculatedAssessment.variables.calculatedDataTotalChildCareCost +
        calculatedAssessment.variables.calculatedDataTotalSecondResidence +
        calculatedAssessment.variables.calculatedDataPartnerStudentLoans +
        calculatedAssessment.variables.calculatedDataExceptionalCosts,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
