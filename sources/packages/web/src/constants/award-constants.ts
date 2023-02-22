export interface AwardDetail {
  awardType: string;
  description: string;
}

export const FULL_TIME_AWARDS: AwardDetail[] = [
  {
    awardType: "CSLF",
    description: "Canada Student Loan for Full-time Studies",
  },
  {
    awardType: "CSGP",
    description: "Canada Student Grant for Student with Permanent Disability",
  },
  {
    awardType: "CSGD",
    description: "Canada Student Grant for Students with Dependents",
  },
  {
    awardType: "CSGF",
    description: "Canada Student Grant for Full-time Studies",
  },
  {
    awardType: "CSGT",
    description: "Canada Student Grant for Full-time Top-up",
  },
  {
    awardType: "BCSL",
    description: "B.C. Student Loan",
  },
  {
    awardType: "BCAG",
    description: "B.C. Access Grant",
  },
  {
    awardType: "BGPD",
    description: "B.C. Permanent Disability Grant",
  },
  {
    awardType: "SBSD",
    description: "B.C. Supplemental Bursary with Disabilities",
  },
];

export const PART_TIME_AWARDS: AwardDetail[] = [
  {
    awardType: "CSLP",
    description: "Canada Student Loan for Part-time Studies",
  },
  {
    awardType: "CSGP",
    description: "Canada Student Grant for Student with Permanent Disability",
  },
  {
    awardType: "CSPT",
    description: "Canada Student Grant for Part-time Studies",
  },
  {
    awardType: "CSGD",
    description: "Canada Student Grant for Students with Dependents",
  },
  {
    awardType: "BCAG",
    description: "B.C. Access Grant",
  },
  {
    awardType: "SBSD",
    description: "B.C. Supplemental Bursary with Disabilities",
  },
];
