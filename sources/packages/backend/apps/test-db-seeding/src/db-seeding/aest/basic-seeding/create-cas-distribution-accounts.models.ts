import { OfferingIntensity } from "@sims/sims-db";

export interface CASDistributionAccountBaseData {
  awardValueCode: string;
  offeringIntensity: OfferingIntensity;
  operationCode: "CR" | "DR";
}

export const CAS_DISTRIBUTION_ACCOUNTS_INITIAL_DATE: CASDistributionAccountBaseData[] =
  [
    {
      awardValueCode: "BCAG",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.fullTime,
    },
    {
      awardValueCode: "BCAG",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.fullTime,
    },
    {
      awardValueCode: "BGPD",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.fullTime,
    },
    {
      awardValueCode: "BGPD",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.fullTime,
    },
    {
      awardValueCode: "SBSD",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.fullTime,
    },
    {
      awardValueCode: "SBSD",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.fullTime,
    },
    {
      awardValueCode: "BCAG",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.partTime,
    },
    {
      awardValueCode: "BCAG",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.partTime,
    },
    {
      awardValueCode: "SBSD",
      operationCode: "CR",
      offeringIntensity: OfferingIntensity.partTime,
    },
    {
      awardValueCode: "SBSD",
      operationCode: "DR",
      offeringIntensity: OfferingIntensity.partTime,
    },
  ];
