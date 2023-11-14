import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../test-utils";
import { YesNoOptions } from "@sims/test-utils";
import { CredentialType, InstitutionTypes } from "../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-BCAG.`, () => {
  it(
    "Should determine BCAG as eligible when total assessed need is greater than 0 " +
      `, institution type is ${InstitutionTypes.BCPublic}, total family income is less than the threshold ` +
      `and program credential type is ${CredentialType.UnderGraduateDegree} for separated student.`,
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "other";
      assessmentConsolidatedData.studentDataDependantstatus = "independant";
      assessmentConsolidatedData.institutionType = InstitutionTypes.BCPublic;
      assessmentConsolidatedData.programCredentialType =
        CredentialType.UnderGraduateDegree;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(true);
      expect(
        calculatedAssessment.variables.finalProvincialAwardNetBCAGAmount,
      ).toBeGreaterThan(0);
    },
  );

  it(`Should determine BCAG as not eligible when institution type is ${InstitutionTypes.BCPrivate} for a married student.`, async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourSpouseACanadianCitizen =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataDependantstatus = "independant";
    assessmentConsolidatedData.institutionType = InstitutionTypes.BCPrivate;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
  });

  it(`Should determine BCAG as not eligible when program credential type is ${CredentialType.GraduateDegreeOrMasters} for a single student.`, async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.programCredentialType =
      CredentialType.GraduateDegreeOrMasters;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBCAG).toBe(false);
  });
});
