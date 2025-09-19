import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  executeFullTimeConfigureDisbursement,
} from "../../../test-utils";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { createFakeConfigureDisbursementFullTimeData } from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-disbursements`, () => {
  // An array of award amounts to verify first and second disbursement value amounts.
  const TEST_FINAL_AWARD_NET_AMOUNTS = [
    {
      finalAwardNetAmount: 350,
      roundDownAwardNetAmount: 350,
    },
    {
      finalAwardNetAmount: 375,
      roundDownAwardNetAmount: 375,
    },
    {
      finalAwardNetAmount: 100.5,
      roundDownAwardNetAmount: 100,
    },
    {
      finalAwardNetAmount: 100.9,
      roundDownAwardNetAmount: 100,
    },
    {
      finalAwardNetAmount: 101.9,
      roundDownAwardNetAmount: 101,
    },
  ];

  it("Should generate 1 disbursement when offering weeks is equal to 17 weeks or less.", async () => {
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(30),
    );
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(240),
    );
    // Act
    const calculatedAssessment = await executeFullTimeConfigureDisbursement(
      configureDisbursementData,
    );
    // Assert
    expect(calculatedAssessment.variables.disbursementSchedules).toStrictEqual([
      {
        disbursementDate: configureDisbursementData.offeringStudyStartDate,
        negotiatedExpiryDate: configureDisbursementData.offeringStudyStartDate,
        disbursements: [
          {
            awardEligibility: true,
            valueAmount: 4000,
            valueCode: "CSLF",
            valueType: "Canada Loan",
          },
          {
            awardEligibility: true,
            valueAmount: 3000,
            valueCode: "CSGP",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 2000,
            valueCode: "CSGD",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 1000,
            valueCode: "CSGF",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 8000,
            valueCode: "BCSL",
            valueType: "BC Loan",
          },
          {
            awardEligibility: true,
            valueAmount: 7000,
            valueCode: "BCAG",
            valueType: "BC Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 5000,
            valueCode: "BGPD",
            valueType: "BC Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 6000,
            valueCode: "SBSD",
            valueType: "BC Grant",
          },
        ],
      },
    ]);
  });

  it("Should not generate disbursement values for an award when eligibility is undefined.", async () => {
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(30),
    );
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(240),
    );
    configureDisbursementData.awardEligibilityBCAG = undefined;
    // Act
    const calculatedAssessment = await executeFullTimeConfigureDisbursement(
      configureDisbursementData,
    );
    // Assert
    expect(calculatedAssessment.variables.disbursementSchedules).toStrictEqual([
      {
        disbursementDate: configureDisbursementData.offeringStudyStartDate,
        negotiatedExpiryDate: configureDisbursementData.offeringStudyStartDate,
        disbursements: [
          {
            awardEligibility: true,
            valueAmount: 4000,
            valueCode: "CSLF",
            valueType: "Canada Loan",
          },
          {
            awardEligibility: true,
            valueAmount: 3000,
            valueCode: "CSGP",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 2000,
            valueCode: "CSGD",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 1000,
            valueCode: "CSGF",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 8000,
            valueCode: "BCSL",
            valueType: "BC Loan",
          },
          {
            awardEligibility: true,
            valueAmount: 5000,
            valueCode: "BGPD",
            valueType: "BC Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 6000,
            valueCode: "SBSD",
            valueType: "BC Grant",
          },
        ],
      },
    ]);
  });

  it(
    "Should generate 1 disbursement when offering weeks is greater than 17 weeks " +
      "but potential disbursement schedule date 2 is no greater than today.",
    async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(-30),
      );
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(30),
      );
      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );
      // Assert
      //Check if there is one disbursement schedule item
      expect(calculatedAssessment.variables.disbursementSchedules).toHaveLength(
        1,
      );
      //Check if the disbursement schedule dates are correct
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .disbursementDate,
      ).toBe(configureDisbursementData.offeringStudyStartDate);
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .negotiatedExpiryDate,
      ).toBe(configureDisbursementData.offeringStudyStartDate);
    },
  );

  it(
    "Should generate 2 disbursements when offering weeks is greater than 17 weeks " +
      " and potential disbursement schedule date 2 is greater than today.",
    async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(30),
      );
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(240),
      );
      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );
      // Assert
      //Check if there are two disbursement schedules
      expect(calculatedAssessment.variables.disbursementSchedules).toHaveLength(
        2,
      );
      //Check if the disbursement schedule dates are correct
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .disbursementDate,
      ).toBe(configureDisbursementData.offeringStudyStartDate);
      expect(
        calculatedAssessment.variables.disbursementSchedules[1]
          .disbursementDate,
      ).toBe(getISODateOnlyString(addDays(135)));
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .negotiatedExpiryDate,
      ).toBe(configureDisbursementData.offeringStudyStartDate);
      expect(
        calculatedAssessment.variables.disbursementSchedules[1]
          .negotiatedExpiryDate,
      ).toBe(getISODateOnlyString(addDays(135)));
    },
  );

  describe("Should round down the values for the disbursement when only one disbursement is expected and ", () => {
    for (const testFinalAwardNetAmount of TEST_FINAL_AWARD_NET_AMOUNTS) {
      it(`the final award of each type is ${testFinalAwardNetAmount.finalAwardNetAmount}.`, async () => {
        // Arrange
        const configureDisbursementData =
          createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
        configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
          addDays(30),
        );
        configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
          addDays(240),
        );
        configureDisbursementData.finalFederalAwardNetCSGFAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSGDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSGPAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSLFAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetBGPDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetSBSDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetBCAGAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetBCSLAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        // Act
        const calculatedAssessment = await executeFullTimeConfigureDisbursement(
          configureDisbursementData,
        );
        // Assert
        expect(
          calculatedAssessment.variables.disbursementSchedules,
        ).toStrictEqual([
          {
            disbursementDate: configureDisbursementData.offeringStudyStartDate,
            negotiatedExpiryDate:
              configureDisbursementData.offeringStudyStartDate,
            disbursements: [
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.roundDownAwardNetAmount,
                valueCode: "CSLP",
                valueType: "Canada Loan",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.roundDownAwardNetAmount,
                valueCode: "CSGP",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.roundDownAwardNetAmount,
                valueCode: "CSGD",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.roundDownAwardNetAmount,
                valueCode: "CSPT",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.roundDownAwardNetAmount,
                valueCode: "BCAG",
                valueType: "BC Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.roundDownAwardNetAmount,
                valueCode: "SBSD",
                valueType: "BC Grant",
              },
            ],
          },
        ]);
      });
    }
  });

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
