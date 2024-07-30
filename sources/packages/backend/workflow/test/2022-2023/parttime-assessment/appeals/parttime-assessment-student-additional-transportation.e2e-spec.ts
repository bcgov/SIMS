import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
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
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportListedDriver =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataAdditionalTransportOwner =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 30;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 15;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.No;

      assessmentConsolidatedData.appealsStudentAdditionalTransportationAppealData =
        {
          additionalTransportRequested: YesNoOptions.Yes,
          additionalTransportListedDriver: YesNoOptions.Yes,
          additionalTransportOwner: YesNoOptions.Yes,
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
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportRequested,
      ).toBe(YesNoOptions.Yes);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportListedDriver,
      ).toBe(YesNoOptions.Yes);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportOwner,
      ).toBe(YesNoOptions.Yes);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportKm,
      ).toBe(12);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportWeeks,
      ).toBe(1);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportPlacement,
      ).toBe(YesNoOptions.Yes);
    },
  );

  it(
    "Should have calculated student additional transportation variables assigned with 0 " +
      "when there is a request a change for not eligible for transportation allowance.",
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
      assessmentConsolidatedData.studentDataAdditionalTransportKm = 30;
      assessmentConsolidatedData.offeringWeeks = 20;
      assessmentConsolidatedData.studentDataAdditionalTransportWeeks = 15;
      assessmentConsolidatedData.studentDataAdditionalTransportPlacement =
        YesNoOptions.Yes;

      assessmentConsolidatedData.appealsStudentAdditionalTransportationAppealData =
        {
          additionalTransportRequested: YesNoOptions.No,
        };
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportRequested,
      ).toBe(YesNoOptions.No);
    },
  );

  it(
    "Should have calculated student additional transportation variables assigned with student data values " +
      "when there is no request a change for student additional transportation.",
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
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportRequested,
      ).toBe(YesNoOptions.Yes);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportListedDriver,
      ).toBe(YesNoOptions.Yes);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportOwner,
      ).toBe(YesNoOptions.Yes);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportKm,
      ).toBe(30);
      expect(
        calculatedAssessment.variables.calculatedDataAdditionalTransportWeeks,
      ).toBe(15);
      expect(
        calculatedAssessment.variables
          .calculatedDataAdditionalTransportPlacement,
      ).toBe(YesNoOptions.Yes);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
