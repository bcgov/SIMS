import { OfferingIntensity } from "@sims/sims-db";

export interface CASDistributionAccountBaseData {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: "CR" | "DR";
  distributionAccount: string;
}

export const CAS_DISTRIBUTION_ACCOUNTS_INITIAL_DATE: CASDistributionAccountBaseData[] =
  [
    {
      awardValueCode: "BCAG",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.fullTime,
      distributionAccount: "100.CR.FULL-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "BCAG",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.fullTime,
      distributionAccount: "101.DR.FULL-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "BGPD",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.fullTime,
      distributionAccount: "102.CR.FULL-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "BGPD",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.fullTime,
      distributionAccount: "103.DR.FULL-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "SBSD",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.fullTime,
      distributionAccount: "104.CR.FULL-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "SBSD",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.fullTime,
      distributionAccount: "105.DR.FULL-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "BCAG",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.partTime,
      distributionAccount: "106.CR.PART-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "BCAG",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.partTime,
      distributionAccount: "107.DR.PART-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "SBSD",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.partTime,
      distributionAccount: "108.CR.PART-TIME.00000.0000.0000000.0000",
    },
    {
      awardValueCode: "SBSD",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.partTime,
      distributionAccount: "109.DR.PART-TIME.00000.0000.0000000.0000",
    },
  ];
