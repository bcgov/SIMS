import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-additional-transportation-allowance.`, () => {
  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is zero " +
      "and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 0;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Onsite;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataTotalTransportationAllowance = 13 * 20 = 260
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(260);
    },
  );
  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm is zero  " +
      "and offeringDelivered is not onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 0;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // calculatedDataTotalTransportationAllowance = 0
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(0);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm less than 280 " +
      "and studentDataAdditionalTransportPlacement is true and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 20;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
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
      // calculatedDataTotalTransportationAllowance = (20 - 10) * 69 + (69 * 10 * 0.34) = 1174.6
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1174.6);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm less than 280 " +
      "and studentDataAdditionalTransportPlacement is true and offeringDelivered is not onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 20;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 100;
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
      // calculatedDataTotalTransportationAllowance = 100 * 10 = 1000
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1000);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm more than 280 " +
      "and studentDataAdditionalTransportPlacement is true and offeringDelivered is onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
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
      // calculatedDataTotalTransportationAllowance = (20 - 10) * 94 + (69 * 10) = 1630
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1630);
    },
  );

  it(
    "Should determine calculatedDataTotalTransportationAllowance when studentDataAdditionalTransportKm more than 280 " +
      "and studentDataAdditionalTransportPlacement is true and offeringDelivered is not onsite",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 300;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 100;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement = true;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      console.log(
        "calculatedAssessment.variables: ",
        calculatedAssessment.variables,
      );
      // Assert
      // calculatedDataTotalTransportationAllowance = 100 * 10 = 1000
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalTransportationAllowance,
      ).toBe(1000);
    },
  );
});
