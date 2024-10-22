import { OfferingIntensity } from "@/types";

export interface AwardDetail {
  awardType: FullTimeAwardTypes | PartTimeAwardTypes;
  description: string;
  offeringIntensity: OfferingIntensity;
}

export enum FullTimeAwardTypes {
  CSLF = "CSLF",
  CSGP = "CSGP",
  CSGD = "CSGD",
  CSGF = "CSGF",
  CSGT = "CSGT",
  BCSL = "BCSL",
  BCAG = "BCAG",
  BGPD = "BGPD",
  SBSD = "SBSD",
}

export enum PartTimeAwardTypes {
  CSLP = "CSLP",
  CSGP = "CSGP",
  CSPT = "CSPT",
  CSGD = "CSGD",
  BCAG = "BCAG",
  SBSD = "SBSD",
}

export const AWARDS: AwardDetail[] = [
  {
    awardType: FullTimeAwardTypes.CSLF,
    description: "Canada Student Loan for Full-time Studies",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGP,
    description: "Canada Student Grant for Student with Permanent Disability",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGD,
    description: "Canada Student Grant for Students with Dependents",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGF,
    description: "Canada Student Grant for Full-time Studies",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGT,
    description: "Canada Student Grant for Full-time Top-up",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: PartTimeAwardTypes.CSLP,
    description: "Canada Student Loan for Part-time Students",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.CSGP,
    description: "Canada Student Grant for Students with Disabilities",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.CSPT,
    description: "Canada Student Grant for Part-time Students",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.CSGD,
    description: "Canada Student Grant for Students with Dependants",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: FullTimeAwardTypes.BCSL,
    description: "B.C. Student Loan",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.BCAG,
    description: "B.C. Access Grant",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.BGPD,
    description: "B.C. Permanent Disability Grant",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.SBSD,
    description: "B.C. Supplemental Bursary with Disabilities",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: PartTimeAwardTypes.BCAG,
    description: "B.C. Access Grant for Part-time Studies",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.SBSD,
    description: "B.C. Supplemental Bursary for Students with Disabilities",
    offeringIntensity: OfferingIntensity.partTime,
  },
];

export const PartTimeAwardTypesObject = {
  CSLP: "CSL-PT",
  CSGP: "CSG-PD",
  CSPT: "CSG-PT",
  CSGD: "CSG-PTDEP",
  BCAG: "BCAG-PT",
  SBSD: "SBSD",
};
