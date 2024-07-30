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

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is owner of the vehicle " +
      "and the student receive practicum placement allowance and calculated additional transport cost.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 5;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(13);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(130);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(208);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is owner of the vehicle " +
      "and the student receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(13);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(130);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(208);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is owner of the vehicle " +
      "and the student does not receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(34);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(340);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(418);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is not owner of the vehicle " +
      "and the student does not receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 240;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(69);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(690);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(768);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is owner of the vehicle " +
      "and the student receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 240;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(56.6);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(566);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(644);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is not owner of the vehicle " +
      "and the student receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 240;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(44);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(440);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(518);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered onsite " +
      "when there is additional transportation needed and the student is owner of the vehicle " +
      "and the student does not receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
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
      ).toBe(94);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(940);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1018);
    },
  );

  it(
    "Should determine transportation allowance for an offering delivered online " +
      "when there is additional transportation needed and the student is owner of the vehicle " +
      "and the student does not receive practicum placement allowance.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 16;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;
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
      ).toBe(94);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(940);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(940);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
