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
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-student-financial-information.`, () => {
  it(
    "Should have calculated student financial information variables assigned with request a change values " +
      "when there is a request a change for student financial information.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
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

      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
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

  it(
    "Should have calculated student total income from the current year income and not from the the application data or the tax return income " +
      "when there is a request a change for student financial information with current year income values.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
      assessmentConsolidatedData.appealsStudentFinancialInformationAppealData =
        {
          taxReturnIncome: 1234,
          currentYearIncome: 500,
        };

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataCurrentYearIncome,
      ).toBe(500);
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(500);
      expect(
        calculatedAssessment.variables.calculatedDataStudentTotalIncome,
      ).toBe(500);
    },
  );

  it(
    "Should have calculated student total income from the tax return income and not from the the application data tax return income " +
      "when there is a request a change for student financial information with tax return income values.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = null;
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
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
      // Application data tax return income submitted by the student.
      expect(assessmentConsolidatedData.studentDataTaxReturnIncome).toBe(40001);
      expect(
        calculatedAssessment.variables.calculatedDataTotalFamilyIncome,
      ).toBe(1234);
      expect(
        calculatedAssessment.variables.calculatedDataStudentTotalIncome,
      ).toBe(1234);
    },
  );

  it(
    "Should have calculated student total income from the CRA income " +
      "when there is an appeal but the current year's income is not provided.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 999;
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
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
        calculatedAssessment.variables.calculatedDataStudentTotalIncome,
      ).toBe(999);
    },
  );

  it(
    "Should have calculated current year partner income in student financial information " +
      "when there is a request a change for current year partner income.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.appealsStudentFinancialInformationAppealData =
        {
          taxReturnIncome: 1000,
          currentYearPartnerIncome: 2000,
        };

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.calculatedDataTaxReturnIncome).toBe(
        1000,
      );
      expect(
        calculatedAssessment.variables.calculatedDataCurrentYearPartnerIncome,
      ).toBe(2000);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
