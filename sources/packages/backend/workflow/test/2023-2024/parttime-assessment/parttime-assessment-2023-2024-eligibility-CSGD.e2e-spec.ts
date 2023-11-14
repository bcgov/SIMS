import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-CSGD.`, () => {
  it(
    "Should determine CSGD as eligible when total assessed need is greater than 0 " +
      ", total eligible dependant is at least 1 and total family income is less than the " +
      "threshold for a married student.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataDependantstatus = "independant";
      assessmentConsolidatedData.studentDataDependants = [
        {
          age: null,
          fullName: "Jack",
          dateOfBirth: "2023-10-29",
          validDependent: 0,
          declaredOnTaxes: YesNoOptions.No,
          isavalidDependant: true,
          attendingPostSecondarySchool: YesNoOptions.No,
        },
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

  it("Should determine CSGD as not eligible when  total family income is greater than threshold with dependant for a single student.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataDependants = [
      {
        age: null,
        fullName: "Alex",
        dateOfBirth: "2023-09-01",
        validDependent: 0,
        declaredOnTaxes: YesNoOptions.No,
        isavalidDependant: true,
        attendingPostSecondarySchool: YesNoOptions.No,
      },
    ];
    assessmentConsolidatedData.studentDataCRAReportedIncome = 100000;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
  });

  it("Should determine CSGD as not eligible when there is no total eligible dependant for a divorced student.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "other";
    assessmentConsolidatedData.studentDataDependantstatus = "independant";
    // No total eligible dependant.
    assessmentConsolidatedData.studentDataDependants = undefined;
    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityCSGD).toBe(false);
  });
});
