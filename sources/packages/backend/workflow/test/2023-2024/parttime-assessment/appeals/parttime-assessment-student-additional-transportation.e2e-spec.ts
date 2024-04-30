import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { TransportationCostSituation } from "../../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-student-additional-transportation.`, () => {
  it(
    "Should have calculated student additional transportation variables assigned with request a change values " +
      "when there is a request a change for student additional transportation.",
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

      assessmentConsolidatedData.appealsStudentAdditionalTransportationAppealData =
        {
          additionalTransportKm: 12,
          additionalTransportCost: 111,
          additionalTransportWeeks: 1,
          transportationCostSituation: TransportationCostSituation.NoLimit,
          additionalTransportPlacement: YesNoOptions.Yes,
        };
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportKm,
      ).toBe(12);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportCost,
      ).toBe(111);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportWeeks,
      ).toBe(1);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportPlacement,
      ).toBe(true);
    },
  );

  it(
    "Should have calculated student additional transportation variables assigned with 0 " +
      "when there is a request a change for student additional transportation not required.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 30;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 15;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 30;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;

      assessmentConsolidatedData.appealsStudentAdditionalTransportationAppealData =
        {
          transportationCostSituation: TransportationCostSituation.NotRequired,
        };
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportKm,
      ).toBe(0);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportCost,
      ).toBe(0);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportWeeks,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportPlacement,
      ).toBe(false);
    },
  );

  it(
    "Should have calculated student additional transportation variables assigned with student data values " +
      "when there is no request a change for student additional transportation.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 30;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 15;
      assessmentConsolidatedData.studentDataAdditionalTransportCost = 10;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportKm,
      ).toBe(30);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportCost,
      ).toBe(10);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportWeeks,
      ).toBe(15);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportPlacement,
      ).toBe(true);
    },
  );
});
