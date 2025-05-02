import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  executePartTimeConfigureDisbursement,
} from "../../../test-utils";
import { addDays, getISODateOnlyString, getUTCNow } from "@sims/utilities";
import { createFakeConfigureDisbursementPartTimeData } from "../../../test-utils/factories";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-disbursements`, () => {
  // An array of award amounts to verify first and second disbursement value amounts.
  const TEST_FINAL_AWARD_NET_AMOUNTS = [
    {
      finalAwardNetAmount: 350,
      firstDisbursementAmount: 175,
      secondDisbursementAmount: 175,
      firstDisbursementSBSDAmount: 350,
      secondDisbursementSBSDAmount: 0,
      roundDownAwardNetAmount: 350,
    },
    {
      finalAwardNetAmount: 375,
      firstDisbursementAmount: 188,
      secondDisbursementAmount: 187,
      firstDisbursementSBSDAmount: 375,
      secondDisbursementSBSDAmount: 0,
      roundDownAwardNetAmount: 375,
    },
    {
      finalAwardNetAmount: 100.5,
      firstDisbursementAmount: 50,
      secondDisbursementAmount: 50,
      firstDisbursementSBSDAmount: 100.5,
      secondDisbursementSBSDAmount: 0,
      roundDownAwardNetAmount: 100,
    },
    {
      finalAwardNetAmount: 100.9,
      firstDisbursementAmount: 50,
      secondDisbursementAmount: 50,
      firstDisbursementSBSDAmount: 100.9,
      secondDisbursementSBSDAmount: 0,
      roundDownAwardNetAmount: 100,
    },
    {
      finalAwardNetAmount: 101.9,
      firstDisbursementAmount: 51,
      secondDisbursementAmount: 50,
      firstDisbursementSBSDAmount: 101.9,
      secondDisbursementSBSDAmount: 0,
      roundDownAwardNetAmount: 101,
    },
  ];

  it("Should generate 1 disbursement when offering weeks is equal to 17 weeks or less.", async () => {
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementPartTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(30),
    );
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(240),
    );
    // Act
    const calculatedAssessment = await executePartTimeConfigureDisbursement(
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
            valueAmount: 1000,
            valueCode: "CSLP",
            valueType: "Canada Loan",
          },
          {
            awardEligibility: true,
            valueAmount: 2000,
            valueCode: "CSGP",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 3000,
            valueCode: "CSGD",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 4000,
            valueCode: "CSPT",
            valueType: "Canada Grant",
          },
          {
            awardEligibility: true,
            valueAmount: 5000,
            valueCode: "BCAG",
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
        createFakeConfigureDisbursementPartTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(-30),
      );
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(30),
      );
      // Act
      const calculatedAssessment = await executePartTimeConfigureDisbursement(
        configureDisbursementData,
      );
      // Assert
      expect(
        calculatedAssessment.variables.disbursementSchedules,
      ).toStrictEqual([
        {
          disbursementDate: getISODateOnlyString(getUTCNow()),
          negotiatedExpiryDate: getISODateOnlyString(getUTCNow()),
          disbursements: [
            {
              awardEligibility: true,
              valueAmount: 1000,
              valueCode: "CSLP",
              valueType: "Canada Loan",
            },
            {
              awardEligibility: true,
              valueAmount: 2000,
              valueCode: "CSGP",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 3000,
              valueCode: "CSGD",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 4000,
              valueCode: "CSPT",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 5000,
              valueCode: "BCAG",
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
    },
  );

  it(
    "Should generate 2 disbursements when offering weeks is greater than 17 weeks " +
      " and potential disbursement schedule date 2 is greater than today.",
    async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementPartTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(30),
      );
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(240),
      );
      // Act
      const calculatedAssessment = await executePartTimeConfigureDisbursement(
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
              valueAmount: 500,
              valueCode: "CSLP",
              valueType: "Canada Loan",
            },
            {
              awardEligibility: true,
              valueAmount: 1000,
              valueCode: "CSGP",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 1500,
              valueCode: "CSGD",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 2000,
              valueCode: "CSPT",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 2500,
              valueCode: "BCAG",
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
        {
          disbursementDate: getISODateOnlyString(addDays(135)),
          negotiatedExpiryDate: getISODateOnlyString(addDays(135)),
          disbursements: [
            {
              awardEligibility: true,
              valueAmount: 500,
              valueCode: "CSLP",
              valueType: "Canada Loan",
            },
            {
              awardEligibility: true,
              valueAmount: 1000,
              valueCode: "CSGP",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 1500,
              valueCode: "CSGD",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 2000,
              valueCode: "CSPT",
              valueType: "Canada Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 2500,
              valueCode: "BCAG",
              valueType: "BC Grant",
            },
            {
              awardEligibility: true,
              valueAmount: 0,
              valueCode: "SBSD",
              valueType: "BC Grant",
            },
          ],
        },
      ]);
    },
  );

  describe("Should round down the values for the disbursement when only one disbursement is expected and ", () => {
    for (const testFinalAwardNetAmount of TEST_FINAL_AWARD_NET_AMOUNTS) {
      it(`the final award of each type is ${testFinalAwardNetAmount.finalAwardNetAmount}.`, async () => {
        // Arrange
        const configureDisbursementData =
          createFakeConfigureDisbursementPartTimeData(PROGRAM_YEAR);
        configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
          addDays(30),
        );
        configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
          addDays(240),
        );
        configureDisbursementData.finalFederalAwardNetCSLPAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSGPAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSGDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSPTAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetBCAGAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetSBSDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        // Act
        const calculatedAssessment = await executePartTimeConfigureDisbursement(
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

  describe("Should round down the values for the disbursement when two disbursements are expected and ", () => {
    for (const testFinalAwardNetAmount of TEST_FINAL_AWARD_NET_AMOUNTS) {
      it(`the final award of each type is ${testFinalAwardNetAmount.finalAwardNetAmount}.`, async () => {
        // Arrange
        const configureDisbursementData =
          createFakeConfigureDisbursementPartTimeData(PROGRAM_YEAR);
        configureDisbursementData.offeringWeeks = 18;
        configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
          addDays(30),
        );
        configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
          addDays(240),
        );
        configureDisbursementData.finalFederalAwardNetCSLPAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSGPAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSGDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalFederalAwardNetCSPTAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetBCAGAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        configureDisbursementData.finalProvincialAwardNetSBSDAmount =
          testFinalAwardNetAmount.finalAwardNetAmount;
        // Act
        const calculatedAssessment = await executePartTimeConfigureDisbursement(
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
                valueAmount: testFinalAwardNetAmount.firstDisbursementAmount,
                valueCode: "CSLP",
                valueType: "Canada Loan",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.firstDisbursementAmount,
                valueCode: "CSGP",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.firstDisbursementAmount,
                valueCode: "CSGD",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.firstDisbursementAmount,
                valueCode: "CSPT",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.firstDisbursementAmount,
                valueCode: "BCAG",
                valueType: "BC Grant",
              },
              {
                awardEligibility: true,
                valueAmount:
                  testFinalAwardNetAmount.firstDisbursementSBSDAmount,
                valueCode: "SBSD",
                valueType: "BC Grant",
              },
            ],
          },
          {
            disbursementDate: getISODateOnlyString(addDays(135)),
            negotiatedExpiryDate: getISODateOnlyString(addDays(135)),
            disbursements: [
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.secondDisbursementAmount,
                valueCode: "CSLP",
                valueType: "Canada Loan",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.secondDisbursementAmount,
                valueCode: "CSGP",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.secondDisbursementAmount,
                valueCode: "CSGD",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.secondDisbursementAmount,
                valueCode: "CSPT",
                valueType: "Canada Grant",
              },
              {
                awardEligibility: true,
                valueAmount: testFinalAwardNetAmount.secondDisbursementAmount,
                valueCode: "BCAG",
                valueType: "BC Grant",
              },
              {
                awardEligibility: true,
                valueAmount:
                  testFinalAwardNetAmount.secondDisbursementSBSDAmount,
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
