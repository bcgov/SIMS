import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  createFakeStudentDependentEligibleForChildcareCost,
  DependentChildCareEligibility,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-student-financial-information.`, () => {
  it(
    "Should have calculated student financial information variables assigned with request a change values " +
      "when there is a request a change for student financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible12YearsAndOver,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];
      assessmentConsolidatedData.appealsStudentFinancialInformationAppealData =
        {
          taxReturnIncome: 1234,
          daycareCosts12YearsOrOver: 123,
          daycareCosts11YearsOrUnder: 234,
        };

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.calculatedDataTaxReturnIncome).toBe(
        1234,
      );
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts12YearsOrOver,
      ).toBe(123);
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts11YearsOrUnder,
      ).toBe(234);
    },
  );

  it(
    "Should have calculated 0 for calculated daycare costs values " +
      "when there is no values for daycare costs in request a change for student financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 1000;

      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible12YearsAndOver,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];
      assessmentConsolidatedData.appealsStudentFinancialInformationAppealData =
        {
          taxReturnIncome: 1234,
        };
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts11YearsOrUnder,
      ).toBe(0);
      expect(
        calculatedAssessment.variables.calculatedDataDaycareCosts12YearsOrOver,
      ).toBe(0);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
