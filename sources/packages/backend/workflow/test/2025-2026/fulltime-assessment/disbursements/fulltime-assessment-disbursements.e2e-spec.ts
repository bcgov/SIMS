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
    },
  );

  it(
    "Should generate 2 disbursements when offering weeks is greater than 17 weeks " +
      "and potential disbursement schedule date 2 is greater than today.",
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
    },
  );

  afterAll(async () => {
    // Closes the singleton instance created during test executions.
    await ZeebeMockedClient.getMockedZeebeInstance().close();
  });
});
