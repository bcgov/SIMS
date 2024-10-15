import { InstitutionTypes } from "../../../models";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-eligibility-BGPD.`, () => {
  // Expected and not expected institution types.
  const EXPECTED_INSTITUTION_TYPES = [
    InstitutionTypes.BCPublic,
    InstitutionTypes.BCPrivate,
  ];
  const NOT_EXPECTED_INSTITUTION_TYPES = Object.values(InstitutionTypes).filter(
    (type) => !EXPECTED_INSTITUTION_TYPES.includes(type),
  );

  describe("Should determine BGPD as eligible when the institutionType type is the expected one and financial need is at least $1 and the student has PD status true.", () => {
    for (const institutionType of EXPECTED_INSTITUTION_TYPES) {
      it(`institutionType is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
        assessmentConsolidatedData.institutionType = institutionType;
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(calculatedAssessment.variables.awardEligibilityBGPD).toBe(true);
        expect(
          calculatedAssessment.variables.provincialAwardNetBGPDAmount,
        ).toBeGreaterThan(0);
      });
    }
  });

  describe("Should determine BGPD as not eligible when the institutionType type is not the expected one and financial need is at least $1 and the student has PD status true.", () => {
    for (const institutionType of NOT_EXPECTED_INSTITUTION_TYPES) {
      it(`institutionType is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
        assessmentConsolidatedData.institutionType = institutionType;
        // Act
        const calculatedAssessment =
          await executeFullTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );
        // Assert
        expect(calculatedAssessment.variables.awardEligibilityBGPD).toBe(false);
      });
    }
  });

  it("Should determine BGPD as not eligible when the institutionType type is the expected one and financial need is at least $1 and the student has PD status false.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    expect(calculatedAssessment.variables.awardEligibilityBGPD).toBe(false);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
