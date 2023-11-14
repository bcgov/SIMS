import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { InstitutionTypes } from "../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-SBSD.`, () => {
  it(
    `Should determine SBSD as eligible when institution type is ${InstitutionTypes.BCPrivate}, ` +
      "total assessment need is greater than 0 and application PD/PPD status is 'yes' for single student.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.institutionType = InstitutionTypes.BCPrivate;
      assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(true);
      expect(
        calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
      ).toBeGreaterThan(0);
    },
  );

  it(`Should determine SBSD as not eligible when institution type is ${InstitutionTypes.International} for a married student.`, async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependantstatus = "independant";
    assessmentConsolidatedData.institutionType = InstitutionTypes.International;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
  });

  it("Should determine SBSD as not eligible when application PD/PPD status is 'noIDoNotHaveADisability' for a widowed student.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "other";
    assessmentConsolidatedData.studentDataDependantstatus = "independant";
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus =
      "noIDoNotHaveADisability";

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
  });
});
