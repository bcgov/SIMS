import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-CSPT.`, () => {
  it(
    "Should determine CSPT as eligible when total assessed need is greater than 0 " +
      "and total family income is less than the threshold for a married student with a canadian spouse.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependantstatus = "independant";

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
      expect(
        calculatedAssessment.variables.finalFederalAwardNetCSPTAmount,
      ).toBeGreaterThan(0);
    },
  );

  it(
    "Should determine CSPT as not eligible when total family income is less than the threshold " +
      "(i.e student income is less than threshold) for a single student.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 100000;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(false);
    },
  );
});
