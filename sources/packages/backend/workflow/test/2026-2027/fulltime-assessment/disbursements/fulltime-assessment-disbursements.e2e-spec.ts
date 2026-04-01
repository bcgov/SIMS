import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import {
  ZeebeMockedClient,
  executeFullTimeConfigureDisbursement,
} from "../../../test-utils";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { createFakeConfigureDisbursementFullTimeData } from "../../../test-utils/factories";

describe(`E2E Test Workflow fulltime-assessment-${PROGRAM_YEAR}-disbursements`, () => {
  it("Should generate 1 disbursement when offering weeks is equal to 17 weeks or less.", async () => {
    const OFFERING_WEEKS = 17;
    const TOTAL_OFFERING_DURATION_IN_DAYS = OFFERING_WEEKS * 7;
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringWeeks = 17;
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(30),
    );
    // Offering weeks * 7 to get the offering duration in days and add that to the offering start date to get the offering end date.
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(
        TOTAL_OFFERING_DURATION_IN_DAYS,
        configureDisbursementData.offeringStudyStartDate,
      ),
    );
    // Act
    const calculatedAssessment = await executeFullTimeConfigureDisbursement(
      configureDisbursementData,
    );
    // Assert
    expect(calculatedAssessment.variables.disbursementSchedules).toContainEqual(
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
    );
  });

  it(
    "Should generate 2 disbursements with correct disbursement dates when offering weeks is greater than 17 weeks," +
      " the offering start date is in the past but the midpoint date is in the future.",
    async () => {
      const OFFERING_WEEKS = 18;
      const TOTAL_OFFERING_DURATION_IN_DAYS = OFFERING_WEEKS * 7;
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = OFFERING_WEEKS;

      // Yesterday (today minus 1 day) to ensure the offering start date is in the past.
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(-1),
      );
      // Offering weeks * 7 to get the offering duration in days and add that to the offering start date to get the offering end date.
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(
          TOTAL_OFFERING_DURATION_IN_DAYS,
          configureDisbursementData.offeringStudyStartDate,
        ),
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
      // Disbursement date 1 should be today.
      expect(
        calculatedAssessment.variables.disbursementSchedules[0]
          .disbursementDate,
      ).toBe(getISODateOnlyString(new Date()));
      // Disbursement date 2 should be the midpoint date.
      // Midpoint date is the total offering duration divided by 2.
      // Add days to the offering start date to get the midpoint date.
      expect(
        calculatedAssessment.variables.disbursementSchedules[1]
          .disbursementDate,
      ).toBe(
        getISODateOnlyString(
          addDays(
            TOTAL_OFFERING_DURATION_IN_DAYS / 2,
            configureDisbursementData.offeringStudyStartDate,
          ),
        ),
      );
    },
  );

  it(
    "Should generate 2 disbursements with correct disbursement dates when offering weeks is greater than 17 weeks," +
      " the offering start date is in the future and the midpoint date is in the future.",
    async () => {
      const OFFERING_WEEKS = 18;
      const TOTAL_OFFERING_DURATION_IN_DAYS = OFFERING_WEEKS * 7;
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = OFFERING_WEEKS;
      // 5 days from now to ensure the offering start date is in the future.
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(5),
      );
      // Add total offering duration in days to the offering start date to get the offering end date.
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(
          TOTAL_OFFERING_DURATION_IN_DAYS,
          configureDisbursementData.offeringStudyStartDate,
        ),
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
      // Midpoint date is the total offering duration divided by 2 .
      // Add days to the offering start date to get the midpoint date.
      expect(
        calculatedAssessment.variables.disbursementSchedules[1]
          .disbursementDate,
      ).toBe(
        getISODateOnlyString(
          addDays(
            TOTAL_OFFERING_DURATION_IN_DAYS / 2,
            configureDisbursementData.offeringStudyStartDate,
          ),
        ),
      );
    },
  );

  it(
    "Should generate 1 disbursement with correct disbursement date when offering weeks is greater than 17 weeks," +
      " the offering start date and the midpoint date are in the past.",
    async () => {
      const OFFERING_WEEKS = 18;
      const TOTAL_OFFERING_DURATION_IN_DAYS = OFFERING_WEEKS * 7;
      // Arrange
      const configureDisbursementData =
        createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
      configureDisbursementData.offeringWeeks = OFFERING_WEEKS;
      // 120 days in the past to ensure the offering start date is in the past.
      configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
        addDays(-120),
      );
      // Add total offering duration in days to the offering start date to get the offering end date.
      configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
        addDays(
          TOTAL_OFFERING_DURATION_IN_DAYS,
          configureDisbursementData.offeringStudyStartDate,
        ),
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
      ).toBe(getISODateOnlyString(new Date()));
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
    expect(calculatedAssessment.variables.disbursementSchedules).toContainEqual(
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
    );
  });

  it("Should generate a disbursement schedule even when student is not eligible for any awards.", async () => {
    const OFFERING_WEEKS = 16;
    const TOTAL_OFFERING_DURATION_IN_DAYS = OFFERING_WEEKS * 7;
    // Arrange
    const configureDisbursementData =
      createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR);
    configureDisbursementData.offeringWeeks = OFFERING_WEEKS;
    configureDisbursementData.offeringStudyStartDate = getISODateOnlyString(
      addDays(0),
    );
    configureDisbursementData.offeringStudyEndDate = getISODateOnlyString(
      addDays(
        TOTAL_OFFERING_DURATION_IN_DAYS,
        configureDisbursementData.offeringStudyStartDate,
      ),
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
    expect(calculatedAssessment.variables.disbursementSchedules).toContainEqual(
      {
        disbursementDate: configureDisbursementData.offeringStudyStartDate,
        negotiatedExpiryDate: configureDisbursementData.offeringStudyStartDate,
        disbursements: [],
      },
    );
  });

  // An array of award amounts to verify first and second disbursement value amounts.
  const TEST_FINAL_DISBURSEMENT_AMOUNTS = [
    {
      inputData: {
        offeringWeeks: 19,
        offeringStudyStartDate: getISODateOnlyString(addDays(5)),
        offeringStudyEndDate: getISODateOnlyString(addDays(138)),
        finalFederalAwardNetCSLFAmount: 3000,
        finalFederalAwardNetCSGPAmount: 2000,
        finalFederalAwardNetCSGDAmount: 1000.541,
        finalFederalAwardNetCSGFAmount: 1500,
        finalProvincialAwardNetBCSLAmount: 3500,
        finalProvincialAwardNetBCAGAmount: 2500.451,
        finalProvincialAwardNetBGPDAmount: 1240,
        finalProvincialAwardNetSBSDAmount: 800,
      },
      expectedData: {
        firstDisbDate: getISODateOnlyString(addDays(5)), // Same as offering start date since it's in the future.
        midPointDate: getISODateOnlyString(addDays(71)), // Midpoint date is the total offering duration (133 days) divided by 2 (66 days) plus the offering start date (5 days).
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
      },
      totalFederalAwardAmount: Math.floor(3000 + 2000 + 1000.541 + 350),
      totalProvincialAwardAmount: Math.floor(3500 + 2500.451 + 800 + 1240),
    },
    {
      inputData: {
        offeringWeeks: 18,
        offeringStudyStartDate: getISODateOnlyString(addDays(4)),
        offeringStudyEndDate: getISODateOnlyString(addDays(130)),
        finalFederalAwardNetCSLFAmount: 3000,
        finalFederalAwardNetCSGPAmount: 2000,
        finalFederalAwardNetCSGDAmount: 1000.541,
        finalFederalAwardNetCSGFAmount: 1500,
        finalProvincialAwardNetBCSLAmount: 3500,
        finalProvincialAwardNetBCAGAmount: 2500.451,
        finalProvincialAwardNetBGPDAmount: 1240,
        finalProvincialAwardNetSBSDAmount: 800,
      },
      expectedData: {
        firstDisbDate: getISODateOnlyString(addDays(4)), // Same as offering start date since it's in the future.
        midPointDate: getISODateOnlyString(addDays(67)), // Midpoint date is the total offering duration (126 days) divided by 2 (63 days) plus the offering start date (4 days).
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
      },
      totalFederalAwardAmount: Math.floor(3000 + 2000 + 1000.541 + 350),
      totalProvincialAwardAmount: Math.floor(3500 + 2500.451 + 800 + 1240),
    },
    {
      inputData: {
        offeringWeeks: 19,
        offeringStudyStartDate: getISODateOnlyString(addDays(4)),
        offeringStudyEndDate: getISODateOnlyString(addDays(137)),
        finalFederalAwardNetCSLFAmount: 2000.1,
        finalFederalAwardNetCSGPAmount: 2000,
        finalFederalAwardNetCSGDAmount: 500.213,
        finalFederalAwardNetCSGFAmount: 1500,
        finalProvincialAwardNetBCSLAmount: 3500,
        finalProvincialAwardNetBCAGAmount: 2000.741,
        finalProvincialAwardNetBGPDAmount: 1240,
        finalProvincialAwardNetSBSDAmount: 800,
      },
      expectedData: {
        firstDisbDate: getISODateOnlyString(addDays(4)), // Same as offering start date since it's in the future.
        midPointDate: getISODateOnlyString(addDays(70)), // Midpoint date is the total offering duration (133 days) divided by 2 (66 days) plus the offering start date (5 days).
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
      },
      totalFederalAwardAmount: Math.floor(2000.1 + 2000 + 500.213 + 350),
      totalProvincialAwardAmount: Math.floor(3500 + 2000.741 + 800 + 1240),
    },
  ];
  for (const testFinalAward of TEST_FINAL_DISBURSEMENT_AMOUNTS) {
    it(`Should generate disbursement values correctly rounded and split across both disbursements when the offering is ${testFinalAward.inputData.offeringWeeks} weeks, total federal award is ${testFinalAward.totalFederalAwardAmount} and total provincial award is ${testFinalAward.totalProvincialAwardAmount}.`, async () => {
      // Arrange
      const configureDisbursementData = {
        ...createFakeConfigureDisbursementFullTimeData(PROGRAM_YEAR),
        ...testFinalAward.inputData,
      };

      // Act
      const calculatedAssessment = await executeFullTimeConfigureDisbursement(
        configureDisbursementData,
      );

      const [firstDisbursement, secondDisbursement] =
        calculatedAssessment.variables.disbursementSchedules;
      // Assert
      expect(firstDisbursement).toStrictEqual({
        disbursementDate: testFinalAward.expectedData.firstDisbDate,
        negotiatedExpiryDate: testFinalAward.expectedData.firstDisbDate,
        disbursements: [
          {
            valueCode: "CSLF",
            valueType: "Canada Loan",
            valueAmount: testFinalAward.expectedData.firstDisbCSLF,
            awardEligibility: true,
          },
          {
            valueCode: "CSGP",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.expectedData.firstDisbCSGP,
            awardEligibility: true,
          },
          {
            valueCode: "CSGD",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.expectedData.firstDisbCSGD,
            awardEligibility: true,
          },
          {
            valueCode: "CSGF",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.expectedData.firstDisbCSGF,
            awardEligibility: true,
          },
          {
            valueCode: "BCSL",
            valueType: "BC Loan",
            valueAmount: testFinalAward.expectedData.firstDisbBCSL,
            awardEligibility: true,
          },
          {
            valueCode: "BCAG",
            valueType: "BC Grant",
            valueAmount: testFinalAward.expectedData.firstDisbBCAG,
            awardEligibility: true,
          },
          {
            valueCode: "BGPD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.expectedData.firstDisbBGPD,
            awardEligibility: true,
          },
          {
            valueCode: "SBSD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.expectedData.firstDisbSBSD,
            awardEligibility: true,
          },
        ],
      });

      expect(secondDisbursement).toStrictEqual({
        disbursementDate: testFinalAward.expectedData.midPointDate,
        negotiatedExpiryDate: testFinalAward.expectedData.midPointDate,
        disbursements: [
          {
            valueCode: "CSLF",
            valueType: "Canada Loan",
            valueAmount: testFinalAward.expectedData.secondDisbCSLF,
            awardEligibility: true,
          },
          {
            valueCode: "CSGP",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.expectedData.secondDisbCSGP,
            awardEligibility: true,
          },
          {
            valueCode: "CSGD",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.expectedData.secondDisbCSGD,
            awardEligibility: true,
          },
          {
            valueCode: "CSGF",
            valueType: "Canada Grant",
            valueAmount: testFinalAward.expectedData.secondDisbCSGF,
            awardEligibility: true,
          },
          {
            valueCode: "BCSL",
            valueType: "BC Loan",
            valueAmount: testFinalAward.expectedData.secondDisbBCSL,
            awardEligibility: true,
          },
          {
            valueCode: "BCAG",
            valueType: "BC Grant",
            valueAmount: testFinalAward.expectedData.secondDisbBCAG,
            awardEligibility: true,
          },
          {
            valueCode: "BGPD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.expectedData.secondDisbBGPD,
            awardEligibility: true,
          },
          {
            valueCode: "SBSD",
            valueType: "BC Grant",
            valueAmount: testFinalAward.expectedData.secondDisbSBSD,
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
