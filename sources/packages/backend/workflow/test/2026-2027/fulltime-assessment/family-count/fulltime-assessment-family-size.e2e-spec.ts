import { DependantRelationship } from "@sims/test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
  ZeebeMockedClient,
} from "../../../test-utils";
import {
  createFakeStudentDependentEligible,
  createFakeStudentDependentNotEligible,
  DependentEligibility,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-family-size.`, () => {
  it("Should correctly calculate the family size count when a dependant spouse is selected as the dependant relationship.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
      ),
    ];
    const [dependent] = assessmentConsolidatedData.studentDataDependants;
    dependent.dependantRelationship = DependantRelationship.Spouse;
    assessmentConsolidatedData.studentDataDependants = [dependent];

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(2);
  });

  it("Should correctly calculate the family size count when an independant spouse is selected as the dependant relationship.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentNotEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
      ),
    ];
    const [dependent] = assessmentConsolidatedData.studentDataDependants;
    dependent.dependantRelationship = DependantRelationship.Spouse;
    assessmentConsolidatedData.studentDataDependants = [dependent];

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(2);
  });

  it("Should correctly calculate the family size count when a dependant relationship other than spouse is selected.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
      ),
    ];
    const [dependent] = assessmentConsolidatedData.studentDataDependants;
    dependent.dependantRelationship = DependantRelationship.Child;
    assessmentConsolidatedData.studentDataDependants = [dependent];

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(3);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
