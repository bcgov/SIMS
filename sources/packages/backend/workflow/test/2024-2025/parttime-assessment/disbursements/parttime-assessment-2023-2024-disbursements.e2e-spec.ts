import { PROGRAM_YEAR } from "../../constants/program-year.constants";
import { executePartTimeConfigureDisbursement } from "../../../test-utils";
import { addDays, getISODateOnlyString, getUTCNow } from "@sims/utilities";
import { createFakeConfigureDisbursementPartTimeData } from "../../../test-utils/factories";

describe(`E2E Test Workflow parttime-assessment-${PROGRAM_YEAR}-disbursements`, () => {
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
        disbursementDate: getISODateOnlyString(addDays(30)),
        negotiatedExpiryDate: getISODateOnlyString(addDays(30)),
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
          disbursementDate: getISODateOnlyString(getUTCNow()),
          negotiatedExpiryDate: getISODateOnlyString(getUTCNow()),
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
              valueAmount: 3000,
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
              valueAmount: 3000,
              valueCode: "SBSD",
              valueType: "BC Grant",
            },
          ],
        },
      ]);
    },
  );
});
