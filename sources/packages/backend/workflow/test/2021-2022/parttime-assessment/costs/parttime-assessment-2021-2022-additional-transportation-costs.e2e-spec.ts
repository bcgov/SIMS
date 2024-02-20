import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions } from "@sims/test-utils";
const additionalTransportationOnsiteDistanceLimit = 280;

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-additional-transportation-costs.`, () => {
  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is zero " +
      "and offeringDelivered is onsite",
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
      // calculatedDataTotalTransportationAllowance = dmnPartTimeProgramYearMaximums.limitTransportationAllowance * offeringWeeks = 390
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(390);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is zero " +
      "and offeringDelivered is online",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
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
          .calculatedDataTotalTransportationAllowance,
      ).toBe(0);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `less than ${additionalTransportationOnsiteDistanceLimit} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is true " +
      "and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement = true;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks)) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction = 469.2
      // calculatedDataTotalTransportationAllowance = (30 - 20) * 13 + 469.2 = 599.2
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(469.2);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(599.2);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `less than ${additionalTransportationOnsiteDistanceLimit} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is true " +
      "and offeringDelivered is online",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement = true;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks)) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction = 469.2
      // calculatedDataTotalTransportationAllowance = calculatedDataAdditionalTransportationMax
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(469.2);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(469.2);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `less than ${additionalTransportationOnsiteDistanceLimit} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is false " +
      "and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        false;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction = 544
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax = 674
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(544);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(674);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `less than ${additionalTransportationOnsiteDistanceLimit} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is false " +
      "and offeringDelivered is online",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 100;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        false;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction = 544
      // calculatedDataTotalTransportationAllowance = calculatedDataAdditionalTransportationMax
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(544);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(544);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `more than ${additionalTransportationOnsiteDistanceLimit} km ` +
      "and studentDataAdditionalTransportPlacement is true " +
      "and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement = true;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks)) = 1380
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax = 1510
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(1380);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1510);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `more than ${additionalTransportationOnsiteDistanceLimit} km ` +
      "studentDataAdditionalTransportPlacement is true " +
      "and offeringDelivered is online",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement = true;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks)) = 1380
      // calculatedDataTotalTransportationAllowance = calculatedDataAdditionalTransportationMax
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(1380);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1380);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `more than ${additionalTransportationOnsiteDistanceLimit} km ` +
      "and studentDataAdditionalTransportPlacement is false " +
      "and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        false;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance, studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) = 1600
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax = 1730
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(1600);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1730);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `more than ${additionalTransportationOnsiteDistanceLimit} km ` +
      "and studentDataAdditionalTransportPlacement is false " +
      "and offeringDelivered is online",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        false;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance, studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) = 1600
      // calculatedDataTotalTransportationAllowance = calculatedDataAdditionalTransportationMax
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(1600);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1600);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is " +
      `more than ${additionalTransportationOnsiteDistanceLimit} km ` +
      "and studentDataAdditionalTransportPlacement is false " +
      "and offeringDelivered is onsite " +
      "and offeringWeeks is less than studentDataAdditionalTransportWeeks",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 80;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        false;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance, studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) = 1600
      // calculatedDataTotalTransportationAllowance = calculatedDataAdditionalTransportationMax
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportationMax,
      ).toBe(1600);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1600);
    },
  );
});
