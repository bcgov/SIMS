import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions, YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-transportation-costs.`, () => {
  it(
    "Should determine transportation allowance when there is no additional transportation needed " +
      "for an offering delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the additional transportation allowance to be 0.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(0);
      // Expect the transportation allowance to be calculated.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(390);
    },
  );

  it(
    "Should calculate transportation allowance as 0 when there is no additional transportation needed " +
      "for an offering delivered online.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(0);
    },
  );

  // Test scenarios for transport allowance involving additional transportation.
  const additionalTransportTestData = [
    {
      offeringWeeks: 16,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
      additionalTransportOwner: YesNoOptions.Yes,
      additionalTransportKm: 5,
      additionalTransportWeeks: 10,
      additionalTransportPlacement: YesNoOptions.Yes,
      expectedWeeklyAdditionalTransportCost: 13,
      expectedTotalAdditionalTransportAllowance: 130,
      expectedTotalTransportAllowance: 208,
    },
    {
      offeringWeeks: 16,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
      additionalTransportOwner: YesNoOptions.Yes,
      additionalTransportKm: 100,
      additionalTransportWeeks: 10,
      additionalTransportPlacement: YesNoOptions.Yes,
      expectedWeeklyAdditionalTransportCost: 13,
      expectedTotalAdditionalTransportAllowance: 130,
      expectedTotalTransportAllowance: 208,
    },
    {
      offeringWeeks: 16,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
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
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
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
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
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
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
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
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
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
      additionalTransportRequested: YesNoOptions.Yes,
      additionalTransportListedDriver: YesNoOptions.Yes,
      additionalTransportOwner: YesNoOptions.Yes,
      additionalTransportKm: 280,
      additionalTransportWeeks: 10,
      additionalTransportPlacement: YesNoOptions.No,
      expectedWeeklyAdditionalTransportCost: 94,
      expectedTotalAdditionalTransportAllowance: 940,
      expectedTotalTransportAllowance: 940,
    },
  ];

  for (const additionalTransportTest of additionalTransportTestData) {
    it(
      `Should determine weekly additional transportation cost as ${additionalTransportTest.expectedWeeklyAdditionalTransportCost} when offering is delivered ${additionalTransportTest.offeringDelivered}` +
        `and offering weeks is ${additionalTransportTest.offeringWeeks} and student being the owner of vehicle is ${additionalTransportTest.additionalTransportOwner} ` +
        `and additional transport KM is ${additionalTransportTest.additionalTransportKm} and additional transport weeks is ${additionalTransportTest.additionalTransportWeeks} ` +
        `and student receive practicum placement is ${additionalTransportTest.additionalTransportPlacement}.`,
      async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.studentDataAdditionalTransportRequested =
          additionalTransportTest.additionalTransportRequested;
        assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
          additionalTransportTest.additionalTransportListedDriver;
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
          await executePartTimeAssessmentForProgramYear(
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

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
