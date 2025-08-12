import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-spouse-contribution.`, () => {
  it("Should calculate total fixed student contribution for a married independent student when neither are exempt.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;

    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // The spouse can be exempt from contribution if they are a full-time student at the same time.
    // Or when they have a disability, or are receiving certain types of income assistance.
    expect(
      calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
    ).toBe(false);
    // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
    expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
      1384.6153846153845,
    );
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
    ).toBe(1847.2153846153847);
    expect(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
    ).toBe(769.9384615384616);
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
    ).toBe(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
        calculatedAssessment.variables.calculatedDataTotalFederalFSC,
    );
    // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialContribution,
    ).toBe(
      calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
    );
  });

  it(
    "Should calculate total fixed student contribution for a married independent student when the student is exempt " +
      "and the partner is not exempt, is not a full-time student, and has not already contributed in the program year.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;
      assessmentConsolidatedData.studentDataYouthInCare = YesNoOptions.Yes;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // The spouse can be exempt from contribution if they are a full-time student at the same time.
      // Or when they have a disability, or are receiving certain types of income assistance.
      expect(
        calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        0,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(0);
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(769.9384615384616);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalFederalFSC,
      );
      // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      );
    },
  );

  it(
    "Should calculate total fixed student contribution for a married independent student when the student is exempt " +
      "and the partner is not exempt, is a full-time student (12 week overlap), and has not already contributed.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;
      assessmentConsolidatedData.studentDataYouthInCare = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataPartnerStudyWeeks = 12;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // The spouse can be exempt from contribution if they are a full-time student at the same time.
      // Or when they have a disability, or are receiving certain types of income assistance.
      expect(
        calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        0,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(0);
      // The spouse contribution weeks is the lower of remaining spouse contribution weeks and offering weeks (less any study overlap weeks).
      expect(
        calculatedAssessment.variables.calculatedDataSpouseContributionWeeks,
      ).toBe(4);
      // The total spouse contribution is calculated based on the spouse contribution weeks, spouse contribution rate, and family income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(192.4846153846154);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalFederalFSC,
      );
      // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      );
    },
  );

  it(
    "Should calculate total fixed student contribution for a married independent student when the student is exempt " +
      "and the partner is not exempt, is a full-time student (study weeks greater than offering), and has not already contributed.",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;
      assessmentConsolidatedData.studentDataYouthInCare = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataPartnerStudyWeeks = 20;

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // The spouse can be exempt from contribution if they are a full-time student at the same time.
      // Or when they have a disability, or are receiving certain types of income assistance.
      expect(
        calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        0,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(0);
      // The spouse contribution weeks is the lower of remaining spouse contribution weeks and offering weeks (less any study overlap weeks).
      expect(
        calculatedAssessment.variables.calculatedDataSpouseContributionWeeks,
      ).toBe(16);
      // The total spouse contribution is calculated based on the spouse contribution weeks, spouse contribution rate, and family income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(769.9384615384616);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalFederalFSC,
      );
      // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      );
    },
  );

  it(
    "Should calculate total fixed student contribution for a married independent student when the student is exempt " +
      "and the partner is not exempt, is not a full-time student, and has already contributed in the program year (20 weeks).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;
      assessmentConsolidatedData.studentDataYouthInCare = YesNoOptions.Yes;
      assessmentConsolidatedData.programYearTotalFullTimeSpouseContributionWeeks = 20; // Spouse contribution for 20 weeks have been calculated in the program year.

      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // The spouse can be exempt from contribution if they are a full-time student at the same time.
      // Or when they have a disability, or are receiving certain types of income assistance.
      expect(
        calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
      ).toBe(false);
      // The federal and provincial fixed student contributions are based on family income and size when the student is not exempt.
      expect(calculatedAssessment.variables.calculatedDataTotalFederalFSC).toBe(
        0,
      );
      expect(
        calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      ).toBe(0);
      // Spouse contribution weeks remaining is the max contribution weeks minus the weeks already contributed.
      expect(
        calculatedAssessment.variables
          .calculatedDataRemainingSpouseContributionWeeks,
      ).toBe(14.67);
      // The spouse contribution weeks is the lower of remaining spouse contribution weeks and offering weeks (less any study overlap weeks).
      expect(
        calculatedAssessment.variables.calculatedDataSpouseContributionWeeks,
      ).toBe(14.67);
      // The total spouse contribution is calculated based on the spouse contribution weeks, spouse contribution rate, and family income.
      expect(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution,
      ).toBe(705.937326923077);
      // Combination of federal fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables.calculatedDataTotalFederalContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalFederalFSC,
      );
      // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalProvincialContribution,
      ).toBe(
        calculatedAssessment.variables.calculatedDataTotalSpouseContribution +
          calculatedAssessment.variables.calculatedDataTotalProvincialFSC,
      );
    },
  );

  it("Should calculate $0 fixed student contribution for a married independent student when both are exempt (EI Benefits).", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 30000;
    assessmentConsolidatedData.studentDataYouthInCare = YesNoOptions.Yes;

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
    // The spouse can be exempt from contribution if they are a full-time student at the same time.
    // Or when they have a disability, or are receiving certain types of income assistance.
    expect(
      calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
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
    ).toBe(0);
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
    // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialContribution,
    ).toBe(0);
  });

  it("Should calculate $0 fixed student contribution for a married independent student when both are exempt (income).", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataHasDependents = YesNoOptions.No;
    assessmentConsolidatedData.studentDataRelationshipStatus = "married";
    assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
      YesNoOptions.No;
    assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 10000;
    assessmentConsolidatedData.studentDataYouthInCare = YesNoOptions.Yes;

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
    // The spouse can be exempt from contribution if they are a full-time student at the same time.
    // Or when they have a disability, or are receiving certain types of income assistance.
    expect(
      calculatedAssessment.variables.calculatedDataSpousalContributionExempt,
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
    ).toBe(0);
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
    // Combination of provincial fixed student contribution, spouse contribution, parental contribution, and targeted resources.
    expect(
      calculatedAssessment.variables.calculatedDataTotalProvincialContribution,
    ).toBe(0);
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
