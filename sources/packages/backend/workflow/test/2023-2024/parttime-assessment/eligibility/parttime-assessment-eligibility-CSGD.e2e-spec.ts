import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import {
  DependentEligibility,
  createFakeStudentDependentBornAfterStudyEndDate,
  createFakeStudentDependentEligible,
} from "../../../test-utils/factories";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-CSGD.`, () => {
  it(
    "Should determine CSGD as eligible when total assessed need is greater than or equal to 1 " +
      ", total eligible dependants is at least 1 and total family income is less than the threshold.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependants = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligible(
          DependentEligibility.Eligible0To18YearsOld,
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
      expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(true);
      expect(
        calculatedAssessment.variables.finalFederalAwardNetCSGDAmount,
      ).toBeGreaterThan(0);
    },
  );

  it("Should determine CSGD as not eligible when total family income is greater than threshold with dependant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependants = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible0To18YearsOld,
        { referenceDate: assessmentConsolidatedData.offeringStudyStartDate },
      ),
    ];
    assessmentConsolidatedData.studentDataCRAReportedIncome = 100000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      0,
    );
  });

  it("Should determine CSGD as not eligible when there is no dependant.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    // No total eligible dependant.
    assessmentConsolidatedData.studentDataDependants = undefined;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      0,
    );
  });

  it("Should determine CSGD as not eligible when there is no dependant born on or before study end date.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    // Dependent(s) born after study end date are not considered
    // as eligible for any calculation.
    assessmentConsolidatedData.studentDataHasDependants = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentBornAfterStudyEndDate(
        assessmentConsolidatedData.offeringStudyEndDate,
      ),
    ];
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(0);
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSGDAmount).toBe(
      0,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
