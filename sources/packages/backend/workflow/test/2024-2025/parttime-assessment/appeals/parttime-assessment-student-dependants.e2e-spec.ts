import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  createFakeStudentDependentEligible,
  DependentEligibility,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-student-dependants.`, () => {
  it(
    "Should have calculated student dependants variables assigned with request a change values " +
      "when there is a request a change for student dependants.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = null;
      assessmentConsolidatedData.appealsStudentHasDependantsAppealData =
        YesNoOptions.Yes;
      assessmentConsolidatedData.appealsStudentDependantsAppealData = [
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible0To18YearsOld,
          {
            referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
          },
        ),
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible18To22YearsOldAttendingHighSchool,
          {
            referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
          },
        ),
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
          {
            referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
          },
        ),
        createFakeStudentDependentEligible(
          DependentEligibility.EligibleOver22YearsOld,
          {
            referenceDate: assessmentConsolidatedData.offeringStudyStartDate,
          },
        ),
      ];
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
      ).toBe(4);
      expect(
        calculatedAssessment.variables.calculatedDataDependants11YearsOrUnder,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataDependants12YearsOverOnTaxes,
      ).toBe(2);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalEligibleDependentsForChildCare,
      ).toBe(2);
    },
  );

  it(
    "Should have calculated student dependants variables assigned with request a change values " +
      "when there is a request a change for student dependants with no dependants.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.appealsStudentHasDependantsAppealData =
        YesNoOptions.No;
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
      ).toBe(0);
      expect(
        calculatedAssessment.variables.calculatedDataDependants11YearsOrUnder,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataDependants12YearsOverOnTaxes,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalEligibleDependentsForChildCare,
      ).toBe(0);
    },
  );

  it(
    "Should have calculated student dependants variables assigned with student application data " +
      "when there is no request a change for student dependants.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.appealsStudentHasDependantsAppealData = null;
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible0To18YearsOld,
          { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
        ),
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
          { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
        ),
        createFakeStudentDependentEligible(
          DependentEligibility.EligibleOver22YearsOld,
          { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
        ),
      ];

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
      ).toBe(3);
      expect(
        calculatedAssessment.variables.calculatedDataDependants11YearsOrUnder,
      ).toBe(0);
      expect(
        calculatedAssessment.variables
          .calculatedDataDependants12YearsOverOnTaxes,
      ).toBe(2);
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalEligibleDependentsForChildCare,
      ).toBe(2);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
