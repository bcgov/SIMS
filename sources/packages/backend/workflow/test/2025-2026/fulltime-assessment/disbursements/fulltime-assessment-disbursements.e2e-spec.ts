import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  executeFullTimeConfigureDisbursement,
} from "../../../test-utils";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { createFakeConfigureDisbursementFullTimeData } from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-disbursements`, () => {
  it("Should generate 1 disbursement when offering weeks is equal to 17 weeks or less.", async () => {
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringWeeks = 17;
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(30),
    );
    // 17 weeks is 119 days, so add 119 days to the offering start date to set the offering end date.
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(119 + 30),
    );
    // Act
    const calculatedAssessment = await executeFullTimeConfigureDisbursement(
      configureDisbursementData,
    );
    // Assert
    expect(calculatedAssessment.variables.disbursementSchedules).toStrictEqual(
      expect.arrayContaining([
        {
          disbursementDate: configureDisbursementData.offeringStudyStartDate,
          negotiatedExpiryDate:
            configureDisbursementData.offeringStudyStartDate,
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
      ]),
    );
  });

  it(
    "Should generate 2 disbursements with correct disbursement dates when offering weeks is greater than 17 weeks," +
      " the offering start date is in the past but the midpoint date is in the future.",
    async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      // Yesterday (today minus 1 day) to ensure the offering start date is in the past.
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(-1),
      );
      // 125 days from now 18 * 7 = 126 days total offering duration less 1 day for it currently being after study start date.
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(125),
      );
      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );
      // Assert
      //Check if there are the expected number of disbursement schedules.
      expect(calculatedAssessment.variables.disbursementSchedules).toHaveLength(
        2,
      );
      // Disbursement date 1 should be today.
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .disbursementDate,
      ).toBe(getISODateOnlyString(addDays(0)));
      // Disbursement date 2 should be the midpoint date.
      // Midpoint date is the total offering duration divided by 2.
      // Add days to the offering start date to get the midpoint date.
      expect(
        calculatedAssessment.variables.disbursementSchedules[1]
          .disbursementDate,
      ).toBe(getISODateOnlyString(addDays(Math.floor(125 / 2))));
    },
  );

  it(
    "Should generate 2 disbursements with correct disbursement dates when offering weeks is greater than 17 weeks," +
      " the offering start date is in the future and the midpoint date is in the future.",
    async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      // 5 days from now to ensure the offering start date is in the future.
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(5),
      );
      // 131 days from now, total offering duration 126 days which is 18 weeks.
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(131),
      );
      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );
      // Assert
      // Check if there are the expected number of disbursement schedules.
      expect(calculatedAssessment.variables.disbursementSchedules).toHaveLength(
        2,
      );
      // Disbursement date 1 should be offering start date.
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .disbursementDate,
      ).toBe(configureDisbursementData.offeringStudyStartDate);
      // Disbursement date 2 should be the midpoint date.
      // Midpoint date is the total offering duration (126 days) divided by 2 (63 days).
      // Add days to the offering start date (5 days from now) to get the midpoint date.
      expect(
        calculatedAssessment.variables.disbursementSchedules[1]
          .disbursementDate,
      ).toBe(getISODateOnlyString(addDays(68)));
    },
  );

  it(
    "Should generate 1 disbursement with correct disbursement date when offering weeks is greater than 17 weeks," +
      " the offering start date and the midpoint date are in the past.",
    async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = 18;
      // 120 days in the past to ensure the offering start date is in the past.
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(-120),
      );
      // 6 days from now, total offering duration 126 days which is 18 weeks.
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(6),
      );
      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );
      // Assert
      // Check if there are the expected number of disbursement schedules.
      expect(calculatedAssessment.variables.disbursementSchedules).toHaveLength(
        1,
      );
      // Disbursement date 1 should be today.
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .disbursementDate,
      ).toBe(getISODateOnlyString(addDays(0)));
    },
  );

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
    expect(calculatedAssessment.variables.disbursementSchedules).toStrictEqual(
      expect.arrayContaining([
        {
          disbursementDate: configureDisbursementData.offeringStudyStartDate,
          negotiatedExpiryDate:
            configureDisbursementData.offeringStudyStartDate,
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
      ]),
    );
  });

  it("Should generate a disbursement schedule even when student is not eligible for any awards.", async () => {
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringWeeks = 16;
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(0),
    );
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(16 * 7),
    );

    configureDisbursementData.awardEligibilityBCSL = false;
    configureDisbursementData.awardEligibilityCSLF = false;
    configureDisbursementData.awardEligibilityCSGP = false;
    configureDisbursementData.awardEligibilityCSGD = false;
    configureDisbursementData.awardEligibilityCSGF = false;
    configureDisbursementData.awardEligibilityBCAG2Year = false;
    configureDisbursementData.awardEligibilityBCAG = false;
    configureDisbursementData.awardEligibilitySBSD = false;
    configureDisbursementData.awardEligibilityBGPD = false;
    // Act
    const calculatedAssessment = await executeFullTimeConfigureDisbursement(
      configureDisbursementData,
    );
    // Assert
    expect(calculatedAssessment.variables.disbursementSchedules).toStrictEqual(
      expect.arrayContaining([
        {
          disbursementDate: configureDisbursementData.offeringStudyStartDate,
          negotiatedExpiryDate:
            configureDisbursementData.offeringStudyStartDate,
          disbursements: [],
        },
      ]),
    );
  });

  // An array of award amounts to verify first and second disbursement value amounts.
  const TEST_FINAL_DISBURSEMENT_AMOUNTS = [
    {
      offeringWeeks: 19,
      offeringStartDate: getISODateOnlyString(addDays(5)),
      offeringEndDate: getISODateOnlyString(addDays(138)),
      midPointDate: getISODateOnlyString(addDays(71)),
      awardAmountCSLF: 3000,
      awardAmountCSGP: 2000,
      awardAmountCSGD: 1000.541,
      awardAmountCSGF: 1500,
      awardAmountBCSL: 3500,
      awardAmountBCAG: 2500.451,
      awardAmountBGPD: 1240,
      awardAmountSBSD: 800,
      firstDisbCSLF: 3000,
      firstDisbCSGP: 1000,
      firstDisbCSGD: 500,
      firstDisbCSGF: 750,
      firstDisbBCSL: 0,
      firstDisbBCAG: 1250,
      firstDisbBGPD: 620,
      firstDisbSBSD: 800,
      secondDisbCSLF: 0,
      secondDisbCSGP: 1000,
      secondDisbCSGD: 500,
      secondDisbCSGF: 750,
      secondDisbBCSL: 3500,
      secondDisbBCAG: 1250,
      secondDisbBGPD: 620,
      secondDisbSBSD: 0,
      totalFederalAwardAmount: Math.floor(3000 + 2000 + 1000.541 + 350),
      totalProvincialAwardAmount: Math.floor(3500 + 2500.451 + 800 + 1240),
    },
    {
      offeringWeeks: 18,
      offeringStartDate: getISODateOnlyString(addDays(4)),
      offeringEndDate: getISODateOnlyString(addDays(130)),
      midPointDate: getISODateOnlyString(addDays(67)),
      awardAmountCSLF: 3000,
      awardAmountCSGP: 2000,
      awardAmountCSGD: 1000.541,
      awardAmountCSGF: 1500,
      awardAmountBCSL: 3500,
      awardAmountBCAG: 2500.451,
      awardAmountBGPD: 1240,
      awardAmountSBSD: 800,
      firstDisbCSLF: 3000,
      firstDisbCSGP: 1000,
      firstDisbCSGD: 500,
      firstDisbCSGF: 750,
      firstDisbBCSL: 3500,
      firstDisbBCAG: 2500,
      firstDisbBGPD: 1240,
      firstDisbSBSD: 800,
      secondDisbCSLF: 0,
      secondDisbCSGP: 1000,
      secondDisbCSGD: 500,
      secondDisbCSGF: 750,
      secondDisbBCSL: 0,
      secondDisbBCAG: 0,
      secondDisbBGPD: 0,
      secondDisbSBSD: 0,
      totalFederalAwardAmount: Math.floor(3000 + 2000 + 1000.541 + 350),
      totalProvincialAwardAmount: Math.floor(3500 + 2500.451 + 800 + 1240),
    },
    {
      offeringWeeks: 19,
      offeringStartDate: getISODateOnlyString(addDays(4)),
      offeringEndDate: getISODateOnlyString(addDays(137)),
      midPointDate: getISODateOnlyString(addDays(70)),
      awardAmountCSLF: 2000.1,
      awardAmountCSGP: 2000,
      awardAmountCSGD: 500.213,
      awardAmountCSGF: 1500,
      awardAmountBCSL: 3500,
      awardAmountBCAG: 2000.741,
      awardAmountBGPD: 1240,
      awardAmountSBSD: 800,
      firstDisbCSLF: 2000,
      firstDisbCSGP: 1000,
      firstDisbCSGD: 250,
      firstDisbCSGF: 750,
      firstDisbBCSL: 350,
      firstDisbBCAG: 1000,
      firstDisbBGPD: 620,
      firstDisbSBSD: 800,
      secondDisbCSLF: 0,
      secondDisbCSGP: 1000,
      secondDisbCSGD: 250,
      secondDisbCSGF: 750,
      secondDisbBCSL: 3150,
      secondDisbBCAG: 1000,
      secondDisbBGPD: 620,
      secondDisbSBSD: 0,
      totalFederalAwardAmount: Math.floor(2000.1 + 2000 + 500.213 + 350),
      totalProvincialAwardAmount: Math.floor(3500 + 2000.741 + 800 + 1240),
    },
  ];
  for (const testFinalAward of TEST_FINAL_DISBURSEMENT_AMOUNTS) {
    it.only(`Should generate disbursement values correctly rounded and split across both disbursements when the offering is ${testFinalAward.offeringWeeks} weeks, total federal award is ${testFinalAward.totalFederalAwardAmount} and total provincial award is ${testFinalAward.totalProvincialAwardAmount}.`, async () => {
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = testFinalAward.offeringWeeks;
      configureDisbursementData.offeringStudyStartDate =
        testFinalAward.offeringStartDate;
      configureDisbursementData.offeringStudyEndDate =
        testFinalAward.offeringEndDate;
      configureDisbursementData.finalFederalAwardNetCSLFAmount =
        testFinalAward.awardAmountCSLF;
      configureDisbursementData.finalFederalAwardNetCSGPAmount =
        testFinalAward.awardAmountCSGP;
      configureDisbursementData.finalFederalAwardNetCSGDAmount =
        testFinalAward.awardAmountCSGD;
      configureDisbursementData.finalFederalAwardNetCSGFAmount =
        testFinalAward.awardAmountCSGF;
      configureDisbursementData.finalProvincialAwardNetBCSLAmount =
        testFinalAward.awardAmountBCSL;
      configureDisbursementData.finalProvincialAwardNetBCAGAmount =
        testFinalAward.awardAmountBCAG;
      configureDisbursementData.finalProvincialAwardNetSBSDAmount =
        testFinalAward.awardAmountSBSD;
      configureDisbursementData.finalProvincialAwardNetBGPDAmount =
        testFinalAward.awardAmountBGPD;

      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );

      // Assert
      expect(
        calculatedAssessment.variables.disbursementSchedules[0],
      ).toStrictEqual({
        disbursementDate: configureDisbursementData.offeringStudyStartDate,
        negotiatedExpiryDate: configureDisbursementData.offeringStudyStartDate,
        disbursements: [
          {
            valueCode: "CSLF",
            valueType: "Canada Loan",
            valueAmount: testFinalAward.firstDisbCSLF,
            awardEligibility: true,
          },
          {
            valueCode: "CSGP",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.firstDisbCSGP,
            awardEligibility: true,
          },
          {
            valueCode: "CSGD",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.firstDisbCSGD,
            awardEligibility: true,
          },
          {
            valueCode: "CSGF",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.firstDisbCSGF,
            awardEligibility: true,
          },
          {
            valueCode: "BCSL",
            valueType: "BC Loan",
            valueAmount: testFinalAward.firstDisbBCSL,
            awardEligibility: true,
          },
          {
            valueCode: "BCAG",
            valueType: "BC Grant",
            valueAmount: testFinalAward.firstDisbBCAG,
            awardEligibility: true,
          },
          {
            valueCode: "BGPD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.firstDisbBGPD,
            awardEligibility: true,
          },
          {
            valueCode: "SBSD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.firstDisbSBSD,
            awardEligibility: true,
          },
        ],
      });

      expect(
        calculatedAssessment.variables.disbursementSchedules[1],
      ).toStrictEqual({
        disbursementDate: testFinalAward.midPointDate,
        negotiatedExpiryDate: testFinalAward.midPointDate,
        disbursements: [
          {
            valueCode: "CSLF",
            valueType: "Canada Loan",
            valueAmount: testFinalAward.secondDisbCSLF,
            awardEligibility: true,
          },
          {
            valueCode: "CSGP",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.secondDisbCSGP,
            awardEligibility: true,
          },
          {
            valueCode: "CSGD",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.secondDisbCSGD,
            awardEligibility: true,
          },
          {
            valueCode: "CSGF",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.secondDisbCSGF,
            awardEligibility: true,
          },
          {
            valueCode: "BCSL",
            valueType: "BC Loan",
            valueAmount: testFinalAward.secondDisbBCSL,
            awardEligibility: true,
          },
          {
            valueCode: "BCAG",
            valueType: "BC Grant",
            valueAmount: testFinalAward.secondDisbBCAG,
            awardEligibility: true,
          },
          {
            valueCode: "BGPD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.secondDisbBGPD,
            awardEligibility: true,
          },
          {
            valueCode: "SBSD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.secondDisbSBSD,
            awardEligibility: true,
          },
        ],
      });
    });
  }

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
