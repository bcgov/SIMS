import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentChildCareEligibility,
  createFakeStudentDependentEligibleForChildcareCost,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow full-time-assessment-${PROGRAM_YEAR}-costs-child-care-costs.`, () => {
  it(
    "Should calculate total child care cost as sum of values in student application when " +
      "student has one dependent 11 years or under and " +
      "child care costs entered does not reach maximum allowable limit for the " +
      "given number of dependents and offering weeks " +
      "and student is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.offeringWeeks = 18;
      // Creates 1 eligible dependant.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit
      // Submitted costs are less (1000) than maximum (18 * $268 = $4824)
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        1000,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(1000);
    },
  );

  it(
    "Should calculate total child care cost as sum of values in student application when " +
      "student has one dependent 11 years or under and " +
      "child care costs entered does not reach maximum allowable limit for the " +
      "given number of dependents and offering weeks " +
      "and student is married to a full-time student of less than 12 weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.partner1StudentStudyWeeks = 3;
      assessmentConsolidatedData.partner1TotalIncome = 10000;
      assessmentConsolidatedData.studentDataTaxReturnIncome = 10002;
      // Creates 1 eligible dependent.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit
      // Submitted costs are less (1000) than maximum (18 * $268 = $4824)
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        1000,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(1000);
    },
  );

  it(
    "Should calculate total child care cost as sum of values in student application when " +
      "student has one dependent 11 years or under and " +
      "child care costs entered does not reach maximum allowable limit for the " +
      "given number of dependents and offering weeks " +
      "and student is married to a full-time student of more than 12 weeks.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.partner1StudentStudyWeeks = 13;
      // TODO This is a workaround to allow the correct execution path in the the full time assessment until it can be updated to remove
      // usage of studentDataIsYourPartnerAbleToReport and studentDataPartner* fields
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
      assessmentConsolidatedData.partner1TotalIncome = 10000;
      assessmentConsolidatedData.studentDataTaxReturnIncome = 10002;
      // Creates 1 eligible dependent.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit
      // Submitted costs are less (1000) than maximum (18 * $268 = $4824)
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        1000,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(500);
    },
  );

  it(
    "Should calculate total child care cost as sum of values in student application when " +
      "student has three eligible dependents and " +
      "child care costs entered does not reach maximum allowable limit for the " +
      "given number of dependents and offering weeks " +
      "and student is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 7000;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 7000;
      assessmentConsolidatedData.offeringWeeks = 18;
      // Creates 3 eligible dependent.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit
      // Submitted costs are less (1000) than maximum (18 * $268 * 3 = $14,472)
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        14000,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(14000);
    },
  );

  it(
    "Should calculate total child care cost as sum of values in student application when " +
      "student has three dependents 11 years or under and " +
      "child care costs entered is greater than the maximum allowable limit for the " +
      "given number of dependents and offering weeks " +
      "and student is single.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 45000;
      assessmentConsolidatedData.offeringWeeks = 18;
      // Creates 1 eligible dependent.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit
      // Submitted costs are less (1000) than maximum (18 * $268 * 3 = $14,472)
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        14472,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(14472);
    },
  );

  it(
    "Should calculate total child care cost as $0 when " +
      "student has one dependent 11 years or under with child care costs entered " +
      "and student is married with the partner declaring that they are caring for dependants.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.partner1PartnerCaringForDependant =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 10000;
      assessmentConsolidatedData.studentDataTaxReturnIncome = 10002;
      // Creates 1 eligible dependent.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit.
      // Submitted costs are less (1000) than maximum (18 * $268 = $4824).
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        1000,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period.
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(0);
    },
  );

  it(
    "Should calculate total child care cost as $0 when " +
      "student has one dependent 11 years or under with child care costs entered " +
      "and student is married with the partner did not declare that they are caring for dependants.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 1000;
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.partner1PartnerCaringForDependant =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 10000;
      assessmentConsolidatedData.studentDataTaxReturnIncome = 10002;
      // Creates 1 eligible dependent.
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligibleForChildcareCost(
          DependentChildCareEligibility.Eligible0To11YearsOld,
          assessmentConsolidatedData.offeringStudyStartDate,
        ),
      ];

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Lesser of the child care costs submitted in application or the number of offering weeks times weekly limit.
      // Submitted costs are less (1000) than maximum (18 * $268 = $4824).
      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        1000,
      );
      // Total calculated childcare costs are changed from the calculated child care costs above if student is
      // married to a full-time student who is studying for 12 or more weeks during this study period.
      expect(
        calculatedAssessment.variables.calculatedDataTotalChildCareCost,
      ).toBe(1000);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
