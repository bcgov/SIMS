import { DependantRelationship, YesNoOptions } from "@sims/test-utils";
import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  createFakeConsolidatedPartTimeData,
  executePartTimeAssessmentForProgramYear,
  ZeebeMockedClient,
} from "../../../test-utils";
import {
  createFakeStudentDependentEligible,
  createFakeStudentDependentNotEligible,
  DependentEligibility,
} from "../../../test-utils/factories";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-family-size.`, () => {
  it("Should correctly calculate the family size count when one or more dependants provided in the application has relationship type 'spouse'.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
    assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
    assessmentConsolidatedData.studentDataDependants = [
      createFakeStudentDependentEligible(
        DependentEligibility.EligibleOver22YearsOld,
      ),
    ];
    const [dependent] = assessmentConsolidatedData.studentDataDependants;
    dependent.relationship = DependantRelationship.Spouse;
    assessmentConsolidatedData.studentDataDependants = [dependent];
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;

    // Act
    const calculatedAssessment = await executePartTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );

    // Assert
    expect(
      calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
    ).toBe(1);
    expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(2);
  });

  it(
    "Should correctly calculate the family size count when student relationship status is married and one dependant is provided in the application with relationship type spouse " +
      " and not declared on taxes for disability.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
      assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentNotEligible(
          DependentEligibility.Eligible18To22YearsOldDeclaredOnTaxes,
          { relationship: DependantRelationship.Spouse },
        ),
      ];
      const [dependent] = assessmentConsolidatedData.studentDataDependants;
      dependent.relationship = DependantRelationship.Spouse;
      assessmentConsolidatedData.studentDataDependants = [dependent];
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
      ).toBe(0);
      expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(2);
    },
  );

  it(
    "Should correctly calculate the family size count when student relationship status is married and one dependant is provided in the application with relationship type child " +
      " and declared on taxes for disability.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedPartTimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = true;
      assessmentConsolidatedData.partner1CRAReportedIncome = 22999;
      assessmentConsolidatedData.studentDataDependants = [
        createFakeStudentDependentEligible(
          DependentEligibility.EligibleOver22YearsOld,
        ),
      ];
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.Yes;

      // Act
      const calculatedAssessment =
        await executePartTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );

      // Assert
      expect(
        calculatedAssessment.variables.calculatedDataTotalEligibleDependants,
      ).toBe(1);
      expect(calculatedAssessment.variables.calculatedDataFamilySize).toBe(3);
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
