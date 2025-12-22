import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import {
  createFakeStudentDependentEligible,
  DependentEligibility,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-CSPT.`, () => {
  it(
    "Should determine CSPT as eligible when total assessed need is greater than or equal to 1 " +
      "and total family income is less than the threshold.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataCRAReportedIncome = 1000;
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

  describe("Should determine CSPT as eligible when total assessed need is greater than or equal to 1 and ", () => {
    const familySizeInputs: { familySize: number; familyIncome: number }[] = [
      { familySize: 2, familyIncome: 40000 },
      { familySize: 3, familyIncome: 50000 },
      { familySize: 4, familyIncome: 60000 },
      { familySize: 5, familyIncome: 70000 },
      { familySize: 6, familyIncome: 75000 },
      { familySize: 7, familyIncome: 80000 },
      { familySize: 8, familyIncome: 80000 },
    ];
    for (const { familySize, familyIncome } of familySizeInputs) {
      it(`family size is ${familySize} and family income is ${familyIncome}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.studentDataCRAReportedIncome = familyIncome;
        assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;
        // Considering that the student is single, add dependents to make the family size to expected number.
        assessmentConsolidatedData.studentDataDependants = Array.from(
          { length: familySize - 1 },
          () =>
            createFakeStudentDependentEligible(
              DependentEligibility.Eligible0To18YearsOld,
              {
                referenceDate:
                  assessmentConsolidatedData.offeringStudyStartDate,
              },
            ),
        );

        // Act
        const calculatedAssessment =
          await executePartTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        // Validate family size.
        expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(
          familySize,
        );
        // Validate award eligibility for family size.
        expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(true);
        expect(
          calculatedAssessment.variables.finalFederalAwardNetCSPTAmount,
        ).toBeGreaterThan(0);
      });
    }
  });

  it("Should determine CSPT as not eligible when total family income is greater than the threshold.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataCRAReportedIncome = 100000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(false);
    expect(calculatedAssessment.variables.finalFederalAwardNetCSPTAmount).toBe(
      0,
    );
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
