import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { StudentDependent } from "workflow/test/models";
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

  describe(
    "Should determine CSPT as eligible when total assessed need is greater than or equal to 1 " +
      "and total family income is less than the threshold and ",
    () => {
      const familySizeInputs = [2, 3, 4, 5, 6, 7, 8];
      for (const familySize of familySizeInputs) {
        it(`family size is ${familySize}`, async () => {
          // Arrange
          const assessmentConsolidatedData =
            createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
          assessmentConsolidatedData.studentDataCRAReportedIncome = 1000;
          assessmentConsolidatedData.studentDataHasDependents =
            YesNoOptions.Yes;
          const dependents: StudentDependent[] = [];
          // Considering that the student is single, add dependents to make the family size to expected number.
          for (let i = 1; i < familySize; i++) {
            dependents.push(
              createFakeStudentDependentEligible(
                DependentEligibility.Eligible0To18YearsOld,
                {
                  referenceDate:
                    assessmentConsolidatedData.offeringStudyStartDate,
                },
              ),
            );
          }
          assessmentConsolidatedData.studentDataDependants = dependents;

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
          expect(calculatedAssessment.variables.awardEligibilityCSPT).toBe(
            true,
          );
          expect(
            calculatedAssessment.variables.finalFederalAwardNetCSPTAmount,
          ).toBeGreaterThan(0);
        });
      }
    },
  );

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
