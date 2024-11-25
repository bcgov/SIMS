import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { InstitutionTypes } from "../../../models";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-eligibility-SBSD.`, () => {
  // Expected and not expected institution types.
  const EXPECTED_INSTITUTION_TYPES = [
    InstitutionTypes.BCPublic,
    InstitutionTypes.BCPrivate,
  ];
  const NOT_EXPECTED_INSTITUTION_TYPES = Object.values(InstitutionTypes).filter(
    (type) => !EXPECTED_INSTITUTION_TYPES.includes(type),
  );

  describe("Should determine SBSD as eligible when total assessment need is greater than or equal to 1, application PD/PPD status is 'yes' and", () => {
    for (const institutionType of EXPECTED_INSTITUTION_TYPES) {
      it(`institutionType is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.institutionType = institutionType;
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
      });
    }
  });

  describe("Should determine SBSD as not eligible when total family income is greater than the threshold and", () => {
    for (const institutionType of EXPECTED_INSTITUTION_TYPES) {
      it(`institutionType is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.institutionType = institutionType;
        assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "yes";
        assessmentConsolidatedData.studentDataCRAReportedIncome = 75479;

        // Act
        const calculatedAssessment =
          await executePartTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
        expect(
          calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
        ).toBe(0);
      });
    }
  });

  describe("Should determine SBSD as not eligible when", () => {
    for (const institutionType of NOT_EXPECTED_INSTITUTION_TYPES) {
      it(`institutionType is ${institutionType}`, async () => {
        // Arrange
        const assessmentConsolidatedData =
          createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
        assessmentConsolidatedData.institutionType = institutionType;

        // Act
        const calculatedAssessment =
          await executePartTimeAssessmentForProgramYear(
            PROGRAM_YEAR,
            assessmentConsolidatedData,
          );

        // Assert
        expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
        expect(
          calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
        ).toBe(0);
      });
    }
  });

  it("Should determine SBSD as not eligible when application PD/PPD status is 'no'.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataApplicationPDPPDStatus = "no";

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.awardEligibilitySBSD).toBe(false);
    expect(
      calculatedAssessment.variables.finalProvincialAwardNetSBSDAmount,
    ).toBe(0);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
