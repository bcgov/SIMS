import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-student-contribution.`, () => {
  it(
    "Should calculate total fixed student contribution for a single independent student that is not exempt from contribution " +
      " and has no dependants and no targeted resources.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // If the student is indigenous, a former youth in care, or has a disability, they are exempt from the federal and provincial fixed student contributions.
      expect(
        calculatedAssessment.variables.calculatedDataFederalFSCExempt,
      ).toBe(false);
      expect(
        calculatedAssessment.variables.calculatedDataProvincialFSCExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        851.4692307692308,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(851.4692307692308);
      // The total spouse contribution is not calculated for single students.
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(undefined);
      // The total parental contribution is not calculated for independent students.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentalContribution,
      ).toBe(undefined);
      // Targeted resources are scholarships and bursaries, government funding, non-government funding and voluntary parental contributions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTargetedResources,
      ).toBe(0);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(851.4692307692308);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(851.4692307692308);
    },
  );

  it(
    "Should calculate total fixed student contribution for a single independent student that is not exempt from contribution " +
      "and $1000 of targeted resources.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataScholarshipAmount = 2800;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // If the student is indigenous, a former youth in care, or has a disability, they are exempt from the federal and provincial fixed student contributions.
      expect(
        calculatedAssessment.variables.calculatedDataFederalFSCExempt,
      ).toBe(false);
      expect(
        calculatedAssessment.variables.calculatedDataProvincialFSCExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        851.4692307692308,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(851.4692307692308);
      // The total spouse contribution is not calculated for single students.
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(undefined);
      // The total parental contribution is not calculated for independent students.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentalContribution,
      ).toBe(undefined);
      // Targeted resources are scholarships and bursaries, government funding, non-government funding and voluntary parental contributions.
      // The first $1800 of scholarships and bursaries are exempt from contribution in a program year.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTargetedResources,
      ).toBe(1000);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(1851.4692307692308);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(1851.4692307692308);
    },
  );

  it(
    "Should calculate total fixed student contribution (long offering) for a single independent student that is not exempt from contribution " +
      " and has no targeted resources.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.offeringWeeks = 52;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // If the student is indigenous, a former youth in care, or has a disability, they are exempt from the federal and provincial fixed student contributions.
      expect(
        calculatedAssessment.variables.calculatedDataFederalFSCExempt,
      ).toBe(false);
      expect(
        calculatedAssessment.variables.calculatedDataProvincialFSCExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        1845.027389423077,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(2767.275);
      // The total spouse contribution is not calculated for single students.
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(undefined);
      // The total parental contribution is not calculated for independent students.
      expect(
        calculatedAssessment.variables.calculatedDataTotalParentalContribution,
      ).toBe(undefined);
      // Targeted resources are scholarships and bursaries, government funding, non-government funding and voluntary parental contributions.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTargetedResources,
      ).toBe(0);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(1845.027389423077);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(2767.275);
    },
  );

  it("Should calculate $0 for total fixed student contribution for a single independent student that is exempt from contribution (indigenous).", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataIndigenousStatus = YesNoOptions.Yes;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // If the student is indigenous, a former youth in care, or has a disability, they are exempt from the federal and provincial fixed student contributions.
    expect(calculatedAssessment.variables.calculatedDataFederalFSCExempt).toBe(
      true,
    );
    expect(
      calculatedAssessment.variables.calculatedDataProvincialFSCExempt,
    ).toBe(true);
    // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
    expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
      0,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
    ).toBe(0);
    // The total spouse contribution is not calculated for single students.
    expect(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
    ).toBe(undefined);
    // The total parental contribution is not calculated for independent students.
    expect(
      calculatedAssessment.variables.calculatedDataTotalParentalContribution,
    ).toBe(undefined);
    // Targeted resources are scholarships and bursaries, government funding, non-government funding and voluntary parental contributions.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTargetedResources,
    ).toBe(0);
    // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalFederalContribution,
    ).toBe(0);
    // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialContribution,
    ).toBe(0);
  });
  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
