import { OfferingIntensity } from "@sims/sims-db";
import {
  AssessmentConsolidatedData,
  AssessmentModel,
  CalculatedAssessmentModel,
} from "../../models";
import {
  createFakeAssessmentConsolidatedData,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
  ZeebeMockedClient,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}.`, () => {
  let zeebeClientProvider: ZeebeGrpcClient;
  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should generate expected fulltime assessment values when the student is single and independent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeAssessmentConsolidatedData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringIntensity = OfferingIntensity.fullTime;
    assessmentConsolidatedData.offeringStudyStartDate = "2023-02-01";
    assessmentConsolidatedData.offeringStudyEndDate = "2023-05-24";
    assessmentConsolidatedData.programYearTotalFullTimeReturnTransportationCost = 150;
    assessmentConsolidatedData.programYearTotalFullTimeBooksAndSuppliesCost = 250;

    const expectedAssessmentData: AssessmentModel = {
      weeks: assessmentConsolidatedData.offeringWeeks,
      tuitionCost:
        assessmentConsolidatedData.offeringActualTuitionCosts +
        assessmentConsolidatedData.offeringMandatoryFees,
      childcareCost: 0,
      livingAllowance: 26752,
      totalAssessedCost: 49252,
      totalFamilyIncome: 40000,
      totalFederalAward: 5600,
      otherAllowableCost: 0,
      returnTripHomeCost: 1234,
      returnTransportationCost: 900,
      secondResidenceCost: 0,
      totalAssessmentNeed: 55049.19807692308,
      booksAndSuppliesCost: 1500,
      booksAndSuppliesRemainingLimit: 2750,
      totalProvincialAward: 1760,
      alimonyOrChildSupport: 0,
      federalAssessmentNeed: 47996.70769230769,
      exceptionalEducationCost:
        assessmentConsolidatedData.offeringExceptionalExpenses,
      provincialAssessmentNeed: 47996.70769230769,
      parentAssessedContribution: null,
      partnerAssessedContribution: null,
      studentTotalFederalContribution: 1255.2923076923078,
      studentTotalProvincialContribution: 1255.2923076923078,
    };
    // Act/Assert
    const calculatedAssessment =
      await zeebeClientProvider.createProcessInstanceWithResult<
        AssessmentConsolidatedData,
        CalculatedAssessmentModel
      >({
        bpmnProcessId: `fulltime-assessment-${PROGRAM_YEAR}`,
        variables: {
          ...assessmentConsolidatedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    // TODO: totalFederalContribution and totalProvincialContribution needs to be validated
    // once it is fixed in bpmn.
    expect(calculatedAssessment.variables.offeringWeeks).toBe(
      expectedAssessmentData.weeks,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalTutionCost).toBe(
      expectedAssessmentData.tuitionCost,
    );
    expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
      expectedAssessmentData.childcareCost,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      expectedAssessmentData.totalFamilyIncome,
    );
    expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
      expectedAssessmentData.otherAllowableCost,
    );
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(expectedAssessmentData.returnTransportationCost);
    expect(
      calculatedAssessment.variables.calculatedDataTotalSecondResidence,
    ).toBe(expectedAssessmentData.secondResidenceCost);
    expect(calculatedAssessment.variables.calculatedDataTotalBookCost).toBe(
      expectedAssessmentData.booksAndSuppliesCost,
    );
    expect(
      calculatedAssessment.variables.calculatedDataRemainingBookLimit,
    ).toBe(expectedAssessmentData.booksAndSuppliesRemainingLimit);
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
    ).toBe(expectedAssessmentData.alimonyOrChildSupport);
    expect(calculatedAssessment.variables.offeringExceptionalExpenses).toBe(
      expectedAssessmentData.exceptionalEducationCost,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentalContribution,
    ).toBe(expectedAssessmentData.parentAssessedContribution);
    expect(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
    ).toBe(expectedAssessmentData.partnerAssessedContribution);
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
