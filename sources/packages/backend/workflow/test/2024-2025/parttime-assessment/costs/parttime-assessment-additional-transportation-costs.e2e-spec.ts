import {
  PROGRAM_YEAR,
  ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT,
} from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions, YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-additional-transportation-costs.`, () => {
  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is zero " +
      "and offeringDelivered is onsite.",
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
      // calculatedDataTotalTransportationAllowance = dmnPartTimeProgramYearMaximums.limitTransportationAllowance * offeringWeeks
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(390);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is zero " +
      "and offeringDelivered is online.",
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
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is yes " +
      "and offeringDelivered is onsite.",
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
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks)) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax
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
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is yes " +
      "and offeringDelivered is online.",
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
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks)) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction
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
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is no " +
      "and offeringDelivered is onsite.",
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
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax
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
      `less than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} and greater than 1 km ` +
      "and studentDataAdditionalTransportPlacement is no " +
      "and offeringDelivered is online.",
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
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitAdditionalTransportationKMReduction
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
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} km ` +
      "and studentDataAdditionalTransportPlacement is yes " +
      "and offeringDelivered is onsite.",
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
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks))
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax
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
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} km ` +
      "studentDataAdditionalTransportPlacement is yes " +
      "and offeringDelivered is online.",
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
      // calculatedDataAdditionalTransportationMax = min((dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance - dmnPartTimeProgramYearMaximums.limitAdditionalTransportationPlacement), studentDataAdditionalTransportCost * min(offeringWeeks, studentDataAdditionalTransportWeeks))
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
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} km ` +
      "and studentDataAdditionalTransportPlacement is no " +
      "and offeringDelivered is onsite.",
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
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance, studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks)
      // calculatedDataTotalTransportationAllowance = (offeringWeeks - studentDataAdditionalTransportWeeks) * dmnPartTimeProgramYearMaximums.limitTransportationAllowance + calculatedDataAdditionalTransportationMax
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
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} km ` +
      "and studentDataAdditionalTransportPlacement is no " +
      "and offeringDelivered is online.",
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
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance, studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks)
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
      `more than ${ADDITIONAL_TRANSPORTATION_ONSITE_DISTANCE_LIMIT} km ` +
      "and studentDataAdditionalTransportPlacement is no " +
      "and offeringDelivered is onsite " +
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
      // calculatedDataAdditionalTransportationMax = min(dmnPartTimeProgramYearMaximums.limitAdditionalTransportationAllowance, studentDataAdditionalTransportCost) * min(offeringWeeks, studentDataAdditionalTransportWeeks)
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
