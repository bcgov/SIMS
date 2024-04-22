import {
  PROGRAM_YEAR,
  ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT,
} from "../../constants/program-year.constants";
import {
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
          .calculatedDataAdditionalTransportationAllowance,
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(0);
    },
  );

  it(
    "Should determine transportation allowance as minimum allowance for an offering delivered onsite " +
      `when there is additional transportation needed and additional transport is less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM ` +
      "and including the additional transportation allowance " +
      "make total transportation allowance go less than minimum allowance required for an offering delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 30;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 15;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 30;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(153);
      // Expect the transportation allowance to be minimum allowance for an onsite offering.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(260);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM ` +
      "and student receive allowance from institution for clinical or practicum placement " +
      "for an offering delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(680);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(810);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM ` +
      "and student receive allowance from institution for clinical or practicum placement " +
      "for an offering delivered online.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(680);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(680);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM ` +
      "and student does not receive clinical or practicum placement allowance. " +
      "for an offering delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(680);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(810);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM ` +
      "and student does not receive clinical or practicum placement allowance. " +
      "for an offering delivered online.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(680);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(680);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM` +
      "and student receive allowance from institution for clinical or practicum placement " +
      "for an offering delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(1380);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1510);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM` +
      "and student receive allowance from institution for clinical or practicum placement " +
      "for an offering delivered online.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(1380);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1380);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM` +
      "and student dos not receive clinical or practicum placement allowance " +
      "for an offering delivered onsite.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(1600);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1730);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM` +
      "and student dos not receive clinical or practicum placement allowance " +
      "for an offering delivered online.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(1600);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1600);
    },
  );

  it(
    "Should determine transportation allowance when there is additional transport needed and additional transport is " +
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} KM` +
      "and student dos not receive clinical or practicum placement allowance " +
      "for an offering delivered onsite " +
      "and offeringWeeks is less than studentDataAdditionalTransportWeeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
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
          .calculatedDataAdditionalTransportationAllowance,
      ).toBe(1600);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1600);
    },
  );
});
