import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  DependentEligibility,
  createFakeStudentDependentEligible,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow part-time-assessment-${PROGRAM_YEAR}-costs-child-care-costs.`, () => {
  it(
    "Should calculate child care costs when student has one dependent under 11 years of age and " +
      "another dependent above 12 years and declared on taxes for disability",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataDaycareCosts11YearsOrUnder = 300;
      assessmentConsolidatedData.studentDataDaycareCosts12YearsOrOver = 300;
      assessmentConsolidatedData.offeringWeeks = 8;
      // Creates 4 eligible and 4 not eligible dependents.
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible0To11YearsOld,
          { studyStartDate: assessmentConsolidatedData.offeringStudyStartDate },
        ),
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible12YearsAndOverAndDeclaredOnTaxes,
          { studyStartDate: assessmentConsolidatedData.offeringStudyStartDate },
        ),
      ];
      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Child care cost expected to be studentDataDaycareCosts11YearsOrUnder + studentDataDaycareCosts12YearsOrOver.

      expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(
        600,
      );
    },
  );

  it("Should calculate child care costs as 0 when student has one or more dependents on both categories(11 years and under and over12 years)", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringWeeks = 8;
    // Creates 4 eligible and 4 not eligible dependents.
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To11YearsOld,
        { studyStartDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible12YearsAndOverAndDeclaredOnTaxes,
        { studyStartDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Child care cost expected to be studentDataDaycareCosts11YearsOrUnder + studentDataDaycareCosts12YearsOrOver.

    expect(calculatedAssessment.variables.calculatedDataChildCareCost).toBe(0);
  });
});
