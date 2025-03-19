import { OfferingIntensity } from "@/types";

export interface AwardDetail {
  awardType: FullTimeAwardTypes | PartTimeAwardTypes;
  awardTypeDisplay: string;
  description: string;
  offeringIntensity: OfferingIntensity;
}

export enum FullTimeAwardTypes {
  CSLF = "CSLF",
  CSGP = "CSGP",
  CSGD = "CSGD",
  CSGF = "CSGF",
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
    awardTypeDisplay: FullTimeAwardTypes.CSLF,
    description: "Canada Student Loan for Full-time Studies",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGP,
    awardTypeDisplay: FullTimeAwardTypes.CSGP,
    description: "Canada Student Grant for Student with Permanent Disability",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGD,
    awardTypeDisplay: FullTimeAwardTypes.CSGD,
    description: "Canada Student Grant for Students with Dependents",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.CSGF,
    awardTypeDisplay: FullTimeAwardTypes.CSGF,
    description: "Canada Student Grant for Full-time Studies",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.BCSL,
    awardTypeDisplay: FullTimeAwardTypes.BCSL,
    description: "B.C. Student Loan",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.BCAG,
    awardTypeDisplay: FullTimeAwardTypes.BCAG,
    description: "B.C. Access Grant",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.BGPD,
    awardTypeDisplay: FullTimeAwardTypes.BGPD,
    description: "B.C. Permanent Disability Grant",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: FullTimeAwardTypes.SBSD,
    awardTypeDisplay: FullTimeAwardTypes.SBSD,
    description: "B.C. Supplemental Bursary with Disabilities",
    offeringIntensity: OfferingIntensity.fullTime,
  },
  {
    awardType: PartTimeAwardTypes.CSGP,
    awardTypeDisplay: "CSG-PD",
    description: "Canada Student Grant for Students with Disabilities",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.CSPT,
    awardTypeDisplay: "CSG-PT",
    description: "Canada Student Grant for Part-time Students",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.CSGD,
    awardTypeDisplay: "CSG-PTDEP",
    description: "Canada Student Grant for Students with Dependants",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.BCAG,
    awardTypeDisplay: "BCAG-PT",
    description: "B.C. Access Grant for Part-time Studies",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.CSLP,
    awardTypeDisplay: "CSL-PT",
    description: "Canada Student Loan for Part-time Students",
    offeringIntensity: OfferingIntensity.partTime,
  },
  {
    awardType: PartTimeAwardTypes.SBSD,
    awardTypeDisplay: PartTimeAwardTypes.SBSD,
    description: "B.C. Supplemental Bursary for Students with Disabilities",
    offeringIntensity: OfferingIntensity.partTime,
  },
];
