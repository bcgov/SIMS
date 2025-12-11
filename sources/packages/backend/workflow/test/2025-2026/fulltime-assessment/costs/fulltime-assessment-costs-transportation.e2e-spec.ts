import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions, YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-costs-transportation.`, () => {
  it("Should determine no transportation cost when student does not request return transportation or additional transportation.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataReturnTripHomeCost = null;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Expect the return transportation cost to be 0.
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(0);
    // Expect the additional transportation cost to be null or undefined.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalAdditionalTransportationAllowance,
    ).toBe(undefined);
    // Expect the total transportation cost to be 0.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(0);
  });

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (online delivery).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (no second residence).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.studentDataLivingWithPartner = YesNoOptions.No; // This is the second residence question.
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (Single independant at home).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataSelfContainedSuite =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the Living Category to be at Home (H).
      expect(calculatedAssessment.variables.dmnFullTimeLivingCategory).toBe(
        "SIH",
      );
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );

  it.only(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (Single dependant at home).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataSelfContainedSuite =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1TotalIncome = 0;
      assessmentConsolidatedData.parent1CppEmployment = 0;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 0;
      assessmentConsolidatedData.parent1Ei = 0;
      assessmentConsolidatedData.parent1Tax = 0;
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
      // Expect the Living Category to be at Home (H).
      expect(calculatedAssessment.variables.dmnFullTimeLivingCategory).toBe(
        "SDH",
      );
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );
});

// Test scenarios for transport allowance involving additional transportation.
// Common assumption to all these scenarios is that student require additional transportation
// and student is one of the listed drivers in the insurance.
const ADDITIONAL_TRANSPORT_TEST_DATA = [
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 5,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.Yes,
    expectedWeeklyAdditionalTransportCost: 9,
    expectedTotalAdditionalTransportAllowance: 130,
    expectedTotalTransportAllowance: 208,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 100,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.Yes,
    expectedWeeklyAdditionalTransportCost: 9,
    expectedTotalAdditionalTransportAllowance: 130,
    expectedTotalTransportAllowance: 208,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 100,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.No,
    expectedWeeklyAdditionalTransportCost: 34,
    expectedTotalAdditionalTransportAllowance: 340,
    expectedTotalTransportAllowance: 418,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.No,
    additionalTransportKm: 240,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.No,
    expectedWeeklyAdditionalTransportCost: 69,
    expectedTotalAdditionalTransportAllowance: 690,
    expectedTotalTransportAllowance: 768,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 240,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.Yes,
    expectedWeeklyAdditionalTransportCost: 56.6,
    expectedTotalAdditionalTransportAllowance: 566,
    expectedTotalTransportAllowance: 644,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.No,
    additionalTransportKm: 240,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.Yes,
    expectedWeeklyAdditionalTransportCost: 44,
    expectedTotalAdditionalTransportAllowance: 440,
    expectedTotalTransportAllowance: 518,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Onsite,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 300,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.No,
    expectedWeeklyAdditionalTransportCost: 94,
    expectedTotalAdditionalTransportAllowance: 940,
    expectedTotalTransportAllowance: 1018,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Blended,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 300,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.No,
    expectedWeeklyAdditionalTransportCost: 94,
    expectedTotalAdditionalTransportAllowance: 940,
    expectedTotalTransportAllowance: 1018,
  },
  {
    offeringWeeks: 16,
    offeringDelivered: OfferingDeliveryOptions.Online,
    additionalTransportOwner: YesNoOptions.Yes,
    additionalTransportKm: 280,
    additionalTransportWeeks: 10,
    additionalTransportPlacement: YesNoOptions.No,
    expectedWeeklyAdditionalTransportCost: 94,
    expectedTotalAdditionalTransportAllowance: 940,
    expectedTotalTransportAllowance: 940,
  },
];
describe(
  "Should determine total transportation allowance and additional transportation allowance when student require additional transportation " +
    "and student is one of the listed drivers in the insurance.",
  () => {
    for (const additionalTransportTest of ADDITIONAL_TRANSPORT_TEST_DATA) {
      it(
        `Should determine weekly additional transportation cost as ${additionalTransportTest.expectedWeeklyAdditionalTransportCost} when offering is delivered ${additionalTransportTest.offeringDelivered} ` +
          `and offering weeks is ${additionalTransportTest.offeringWeeks} and student being the owner of vehicle is ${additionalTransportTest.additionalTransportOwner} ` +
          `and additional transport KM is ${additionalTransportTest.additionalTransportKm} and additional transport weeks is ${additionalTransportTest.additionalTransportWeeks} ` +
          `and student receive practicum placement is ${additionalTransportTest.additionalTransportPlacement}.`,
        async () => {
          // Arrange
          const assessmentConsolidatedData =
            createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
          assessmentConsolidatedData.studentDataAdditionalTransportRequested =
            YesNoOptions.Yes;
          assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
            YesNoOptions.Yes;
          assessmentConsolidatedData.studentDataAdditionalTransportOwner =
            additionalTransportTest.additionalTransportOwner;
          assessmentConsolidatedData.studentDataAdditionalTransportKm =
            additionalTransportTest.additionalTransportKm;
          assessmentConsolidatedData.offeringWeeks =
            additionalTransportTest.offeringWeeks;
          assessmentConsolidatedData.studentDataAdditionalTransportWeeks =
            additionalTransportTest.additionalTransportWeeks;
          assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
            additionalTransportTest.additionalTransportPlacement;
          assessmentConsolidatedData.offeringDelivered =
            additionalTransportTest.offeringDelivered;
          // Act
          const calculatedAssessment =
            await executeFullTimeAssessmentForProgramYear(
              PROGRAM_YEAR,
              assessmentConsolidatedData,
            );
          // Assert
          expect(
            calculatedAssessment.variables
              .calculatedDataNetWeeklyAdditionalTransportCost,
          ).toBe(additionalTransportTest.expectedWeeklyAdditionalTransportCost);
          expect(
            calculatedAssessment.variables
              .calculatedDataTotalAdditionalTransportationAllowance,
          ).toBe(
            additionalTransportTest.expectedTotalAdditionalTransportAllowance,
          );
          expect(
            calculatedAssessment.variables
              .calculatedDataTotalTransportationAllowance,
          ).toBe(additionalTransportTest.expectedTotalTransportAllowance);
        },
      );
    }
  },
);

afterAll(async () => {
  // Closes the singleton instance created during test executions.
  await ZeebeMockedClient.getMockedZeebeInstance().close();
});
