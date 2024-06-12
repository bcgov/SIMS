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

    const expectedAssessmentData: AssessmentModel = {
      weeks: assessmentConsolidatedData.offeringWeeks,
      tuitionCost:
        assessmentConsolidatedData.offeringActualTuitionCosts +
        assessmentConsolidatedData.offeringMandatoryFees,
      childcareCost: 0,
      livingAllowance: 1672,
      totalAssessedCost: 27672,
      totalFamilyIncome: 40000,
      totalFederalAward: 7654.615630769231,
      otherAllowableCost: 0,
      transportationCost: 0,
      secondResidenceCost: 0,
      totalAssessmentNeed: 55049.19807692308,
      booksAndSuppliesCost: 5000,
      totalProvincialAward: 11037.417692307692,
      alimonyOrChildSupport: 0,
      federalAssessmentNeed: 26000,
      exceptionalEducationCost:
        assessmentConsolidatedData.offeringExceptionalExpenses,
      provincialAssessmentNeed: 27593.544230769232,
      parentAssessedContribution: null,
      partnerAssessedContribution: null,
      studentTotalFederalContribution: 216.34615384615384,
      studentTotalProvincialContribution: 78.45576923076923,
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
    expect(
      calculatedAssessment.variables.calculatedDataTotalMSOLAllowance,
    ).toBe(expectedAssessmentData.livingAllowance);
    expect(calculatedAssessment.variables.calculatedDataTotalCosts).toBe(
      expectedAssessmentData.totalAssessedCost,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalFamilyIncome).toBe(
      expectedAssessmentData.totalFamilyIncome,
    );
    expect(calculatedAssessment.variables.awardNetFederalTotalAward).toBe(
      expectedAssessmentData.totalFederalAward,
    );
    expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
      expectedAssessmentData.otherAllowableCost,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(expectedAssessmentData.transportationCost);
    expect(
      calculatedAssessment.variables.calculatedDataTotalSecondResidence,
    ).toBe(expectedAssessmentData.secondResidenceCost);
    expect(calculatedAssessment.variables.caclulatedDataTotalAssessedNeed).toBe(
      expectedAssessmentData.totalAssessmentNeed,
    );
    expect(calculatedAssessment.variables.calculatedDataTotalBookCost).toBe(
      expectedAssessmentData.booksAndSuppliesCost,
    );
    expect(calculatedAssessment.variables.awardNetProvincialTotalAward).toBe(
      expectedAssessmentData.totalProvincialAward,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalChildSpousalSupport,
    ).toBe(expectedAssessmentData.alimonyOrChildSupport);
    expect(
      calculatedAssessment.variables.calculatedDataFederalAssessedNeed,
    ).toBe(expectedAssessmentData.federalAssessmentNeed);
    expect(calculatedAssessment.variables.offeringExceptionalExpenses).toBe(
      expectedAssessmentData.exceptionalEducationCost,
    );
    expect(
      calculatedAssessment.variables.calculatedDataProvincialAssessedNeed,
    ).toBe(expectedAssessmentData.provincialAssessmentNeed);
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentalContribution,
    ).toBe(expectedAssessmentData.parentAssessedContribution);
    expect(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
    ).toBe(expectedAssessmentData.partnerAssessedContribution);
    expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
      expectedAssessmentData.studentTotalFederalContribution,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
    ).toBe(expectedAssessmentData.studentTotalProvincialContribution);
  });
});
