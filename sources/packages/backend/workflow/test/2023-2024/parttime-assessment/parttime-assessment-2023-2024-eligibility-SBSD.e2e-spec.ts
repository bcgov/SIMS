import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executeAssessment,
} from "../../test-utils";
import { InstitutionTypes } from "../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-SBSD.`, () => {
  // Expected and not expected institution types.
  const EXPECTED_INSTITUTION_TYPES = [
    InstitutionTypes.BCPublic,
    InstitutionTypes.BCPrivate,
  ];

  describe("Should determine SBSD as eligible when total assessment need is greater than or equal to 1, application PD/PPD status is 'yes' and", () => {
    for (const institutionType of EXPECTED_INSTITUTION_TYPES) {
      it(`institutionType is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.institutionType = institutionType;
        assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";

        // Act
        const calculatedAssessment = await executeAssessment(
          `parttime-assessment-${PROGRAM_YEAR}`,
          assessmentConsolidatedData,
        );

        // Assert
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(true);
        expect(
          calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
        ).toBeGreaterThan(0);
      });
    }
  });

  it(`Should determine SBSD as not eligible when institution type is ${InstitutionTypes.International}.`, async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.institutionType = InstitutionTypes.International;

    // Act
    const calculatedAssessment = await executeAssessment(
      `parttime-assessment-${PROGRAM_YEAR}`,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
  });

  it("Should determine SBSD as not eligible when application PD/PPD status is 'noIDoNotHaveADisability'.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus =
      "noIDoNotHaveADisability";

    // Act
    const calculatedAssessment = await executeAssessment(
      `parttime-assessment-${PROGRAM_YEAR}`,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
  });
});
