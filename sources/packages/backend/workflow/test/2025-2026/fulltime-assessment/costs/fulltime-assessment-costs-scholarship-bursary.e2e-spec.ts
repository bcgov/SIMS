import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow part-time-assessment-${PROGRAM_YEAR}-costs-scholarship-bursary.`, () => {
  it(
    "Should calculate $0 for total scholarship and bursaries when " +
      "student declares that they did not receive any scholarship and bursaries.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataScholarshipAmount = null;
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "single";
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // $0 or null when student did not receive any scholarship or bursaries.
      expect(
        calculatedAssessment.variables.calculatedDataTotalScholarshipsBursaries,
      ).toBe(0);
    },
  );

  it(
    "Should calculate $0 for total scholarship and bursaries when " +
      "student declares that they received scholarship and bursaries less than the program year limit " +
      "and student has not declared any scholarship or bursaries in the current program year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "single";
      assessmentConsolidatedData.studentDataScholarshipAmount = 1700;
      assessmentConsolidatedData.programYearTotalFullTimeScholarshipsBursaries = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert

      // PY limit is $1800 before any declared scholarship or bursary amounts are considered towards contribution.
      expect(
        calculatedAssessment.variables
          .calculatedDataRemainingScholarshipsBursariesLimit,
      ).toBe(1800);
      // The amount declared by the student is used in future applications in the same program year.
      // This should be the lower of the amount declared by the student, or the difference between the PY limit and the remaining limit.
      // ($1700 < $1800, so $1700 is used)
      expect(
        calculatedAssessment.variables
          .calculatedDataExemptScholarshipsBursaries,
      ).toBe(1700);
      // If the amount declared by the student is less then the PY limit less the remaining limit, then the total scholarships and bursaries is $0.
      // ($1700 < $1800, so $0 is used)
      expect(
        calculatedAssessment.variables.calculatedDataTotalScholarshipsBursaries,
      ).toBe(0);
    },
  );

  it(
    "Should calculate $100 for total scholarship and bursaries when " +
      "student declares that they received scholarship and bursaries greater than the program year limit " +
      "and student has not declared any scholarship or bursaries in the current program year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "single";
      assessmentConsolidatedData.studentDataScholarshipAmount = 1900;
      assessmentConsolidatedData.programYearTotalFullTimeScholarshipsBursaries = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert

      // PY limit is $1800 before any declared scholarship or bursary amounts are considered towards contribution.
      expect(
        calculatedAssessment.variables
          .calculatedDataRemainingScholarshipsBursariesLimit,
      ).toBe(1800);
      // The amount declared by the student is used in future applications in the same program year.
      // This should be the lower of the amount declared by the student or the remaining limit.
      // ($1900 > $1800, so $1800 is used)
      expect(
        calculatedAssessment.variables
          .calculatedDataExemptScholarshipsBursaries,
      ).toBe(1800);
      // If the amount declared by the student is greater than the PY limit for exemption, the difference is considered towards the contribution.
      // ($1900 - $1800 = $100)
      expect(
        calculatedAssessment.variables.calculatedDataTotalScholarshipsBursaries,
      ).toBe(100);
    },
  );

  it(
    "Should calculate $1200 for total scholarship and bursaries when " +
      "student declares that they received scholarship and bursaries over the program year limit " +
      "and student has declared scholarship or bursaries in the current program year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "single";
      assessmentConsolidatedData.studentDataScholarshipAmount = 2000;
      assessmentConsolidatedData.programYearTotalFullTimeScholarshipsBursaries = 1000;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert

      // PY limit is $1800 before any declared scholarship or bursary amounts are considered towards contribution.
      // Student has already had an exemption of $1000 in the current program year. ($1800 - $1000 = $800 remaining limit)
      expect(
        calculatedAssessment.variables
          .calculatedDataRemainingScholarshipsBursariesLimit,
      ).toBe(800);
      // The amount declared by the student is used in future applications towards the same PY limit.
      // If the remaining limit is greater than the declared amount, this should be the student declared value. ($2000 > $800 remaining limit)
      expect(
        calculatedAssessment.variables
          .calculatedDataExemptScholarshipsBursaries,
      ).toBe(800);
      // If the amount declared by the student is greater than the PY limit for exemption, the difference is considered towards the contribution.
      // ($2000 - $800 = $1200)
      expect(
        calculatedAssessment.variables.calculatedDataTotalScholarshipsBursaries,
      ).toBe(1200);
    },
  );

  it(
    "Should calculate $0 for total scholarship and bursaries when " +
      "student declares that they received scholarship and bursaries under the program year limit " +
      "and student has declared scholarship or bursaries in the current program year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 18;
      assessmentConsolidatedData.studentDataRelationshipStatus = "single";
      assessmentConsolidatedData.studentDataScholarshipAmount = 600;
      assessmentConsolidatedData.programYearTotalFullTimeScholarshipsBursaries = 1000;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert

      // PY limit is $1800 before any declared scholarship or bursary amounts are considered towards contribution.
      // Student has already had an exemption of $1000 in the current program year. ($1800 - $1000 = $800 remaining limit)
      expect(
        calculatedAssessment.variables
          .calculatedDataRemainingScholarshipsBursariesLimit,
      ).toBe(800);
      // The amount declared by the student is used in future applications towards the same PY limit.
      // If the remaining limit is greater than the declared amount, this should be the student declared value. ($600 < $800 remaining limit)
      expect(
        calculatedAssessment.variables
          .calculatedDataExemptScholarshipsBursaries,
      ).toBe(600);
      // If the amount declared by the student is greater than the PY limit for exemption, the difference is considered towards the contribution.
      // ($600 - $600 = $0)
      expect(
        calculatedAssessment.variables.calculatedDataTotalScholarshipsBursaries,
      ).toBe(0);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
