import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  createFakeConsolidatedFulltimeData,
  executeFullTimeAssessmentForProgramYear,
} from "../../../test-utils";
import { OfferingDeliveryOptions, YesNoOptions } from "@sims/test-utils";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-costs-transportation.`, () => {
  it("Should determine no transportation cost when student does not request return transportation or additional transportation.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.studentDataReturnTripHomeCost = null;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Expect the return transportation cost to be 0.
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(0);
    // Expect the additional transportation cost to be null or undefined.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalAdditionalTransportationAllowance,
    ).toBe(undefined);
    // Expect the total transportation cost to be 0.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(0);
  });

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (online delivery).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.offeringDelivered =
        OfferingDeliveryOptions.Online;
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (living with partner).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.studentDataLivingWithPartner =
        YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataIsYourPartnerAbleToReport = false;
      assessmentConsolidatedData.studentDataRelationshipStatus = "married";
      assessmentConsolidatedData.studentDataPartnerHasEmploymentInsuranceBenefits =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasTotalIncomeAssistance =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataPartnerHasFedralProvincialPDReceipt =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataEstimatedSpouseIncome = 0;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (Single independant at home).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataSelfContainedSuite =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the Living Category to be at Home (H).
      expect(calculatedAssessment.variables.dmnFullTimeLivingCategory).toBe(
        "SIH",
      );
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );

  it(
    "Should determine no transportation cost when student does not request additional transportation and " +
      "they are ineligible for return transportation (Single dependant at home).",
    async () => {
      // Arrange
      const assessmentConsolidatedData =
        createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
      assessmentConsolidatedData.studentDataAdditionalTransportRequested =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
      assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
      assessmentConsolidatedData.studentDataSelfContainedSuite =
        YesNoOptions.No;
      assessmentConsolidatedData.studentDataDependantstatus = "dependant";
      assessmentConsolidatedData.parent1TotalIncome = 0;
      assessmentConsolidatedData.parent1CppEmployment = 0;
      assessmentConsolidatedData.parent1CppSelfemploymentOther = 0;
      assessmentConsolidatedData.parent1Ei = 0;
      assessmentConsolidatedData.parent1Tax = 0;
      assessmentConsolidatedData.parent1Contributions = 0;
      assessmentConsolidatedData.studentDataVoluntaryContributions = 0;
      assessmentConsolidatedData.studentDataParents = [
        {
          parentIsAbleToReport: YesNoOptions.Yes,
        },
      ];
      // Act
      const calculatedAssessment =
        await executeFullTimeAssessmentForProgramYear(
          PROGRAM_YEAR,
          assessmentConsolidatedData,
        );
      // Assert
      // Expect the Living Category to be at Home (H).
      expect(calculatedAssessment.variables.dmnFullTimeLivingCategory).toBe(
        "SDH",
      );
      // Expect the return transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataReturnTransportationCost,
      ).toBe(0);
      // Expect the additional transportation cost to be null or undefined.
      expect(
        calculatedAssessment.variables
          .calculatedDataTotalAdditionalTransportationAllowance,
      ).toBe(undefined);
      // Expect the total transportation cost to be 0.
      expect(
        calculatedAssessment.variables.calculatedDataTotalTransportationCost,
      ).toBe(0);
    },
  );
});

it(
  "Should determine max return transportation cost when an eligible student " +
    "reports costs that would be higher than that for two round trips. (<=26 weeks) ",
  async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringWeeks = 26;
    assessmentConsolidatedData.studentDataReturnTripHomeCost = 452;
    assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataSelfContainedSuite = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Expect the return transportation cost to be $900 as the max for offerings up to 26 weeks.
    // Student declared cost would be $452 x 2 (allowable round trips) = $904.
    // Max is $900 for offerings 27 weeks or longer.
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(900);
    // Expect the additional transportation cost to be null or undefined.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalAdditionalTransportationAllowance,
    ).toBe(undefined);
    // Expect the total transportation cost to be $900.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(900);
  },
);

it(
  "Should determine max return transportation cost when an eligible student " +
    "reports costs that would be higher than that for two round trips (>=27 weeks).",
  async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringWeeks = 27;
    assessmentConsolidatedData.studentDataReturnTripHomeCost = 1000;
    assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataSelfContainedSuite = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Expect the return transportation cost to be $1800.
    // Student declared cost would be $1000 x 2 (allowable round trips) = $2,000.
    // Max is $1,800 for offerings 27 weeks or longer.
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(1800);
    // Expect the additional transportation cost to be null or undefined.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalAdditionalTransportationAllowance,
    ).toBe(undefined);
    // Expect the total transportation cost to be $1800.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(1800);
  },
);

it(
  "Should determine return transportation cost when an eligible student " +
    "reports costs that would be lower than the maximum for two round trips (>=27 weeks).",
  async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringWeeks = 27;
    assessmentConsolidatedData.studentDataReturnTripHomeCost = 600;
    assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataSelfContainedSuite = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Expect the return transportation cost to be $1200.
    // Student declared cost would be $600 x 2 (allowable round trips) = $1200.
    // Max is $1,800 for offerings 27 weeks or longer.
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(1200);
    // Expect the additional transportation cost to be null or undefined.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalAdditionalTransportationAllowance,
    ).toBe(undefined);
    // Expect the total transportation cost to be $1200.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(1200);
  },
);

it(
  "Should determine return transportation cost when an eligible student " +
    "reports costs that would be lower than the maximum for two round trips (>=27 weeks) " +
    "and has previously had return transportation costs.",
  async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.offeringWeeks = 27;
    assessmentConsolidatedData.studentDataReturnTripHomeCost = 600;
    assessmentConsolidatedData.programYearTotalFullTimeReturnTransportationCost = 1000;
    assessmentConsolidatedData.studentDataLivingAtHome = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataSelfContainedSuite = YesNoOptions.Yes;
    assessmentConsolidatedData.studentDataAdditionalTransportRequested =
      YesNoOptions.No;
    // Act
    const calculatedAssessment = await executeFullTimeAssessmentForProgramYear(
      PROGRAM_YEAR,
      assessmentConsolidatedData,
    );
    // Assert
    // Max is $1,800 for the program year.
    // 1800 - 1000 (previously claimed) = 800 (remaining return transportation).
    expect(
      calculatedAssessment.variables
        .calculatedDataRemainingReturnTransportation,
    ).toBe(800);
    // Expect the return transportation cost to be lower of:
    // Remaining return transportation cost ($800),
    // application limit ($1800 for 27+ weeks), or
    // Student declared cost ($600 x 2 allowable round trips = $1200).
    expect(
      calculatedAssessment.variables.calculatedDataReturnTransportationCost,
    ).toBe(800);
    // Expect the additional transportation cost to be null or undefined.
    expect(
      calculatedAssessment.variables
        .calculatedDataTotalAdditionalTransportationAllowance,
    ).toBe(undefined);
    // Expect the total transportation cost to be $1200.
    expect(
      calculatedAssessment.variables.calculatedDataTotalTransportationCost,
    ).toBe(800);
  },
);

afterAll(async () => {
  // Closes the singleton instance created during test executions.
  await ZeebeMockedClient.getMockedZeebeInstance().close();
});
