import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { addToDateOnlyString } from "@sims/utilities";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-CSGT.`, () => {
  it("Should determine CSGT as eligible when studentDataWhenDidYouGraduateOrLeaveHighSchool was at least 10 years ago.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataWhenDidYouGraduateOrLeaveHighSchool =
      addToDateOnlyString(new Date(), -10, "years");
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGT).toBe(true);
    expect(
      calculatedAssessment.variables.federalAwardNetCSGTAmount,
    ).toBeGreaterThan(0);
    expect(
      calculatedAssessment.variables.provincialAwardNetCSGTAmount,
    ).toBeGreaterThan(0);
  });

  it("Should determine CSGT as not eligible when studentDataWhenDidYouGraduateOrLeaveHighSchool was less than 10 years ago.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataWhenDidYouGraduateOrLeaveHighSchool =
      addToDateOnlyString(new Date(), -9, "years");
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGT).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
