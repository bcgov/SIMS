import { IER12FullTimeAssessment } from "./data-inputs.models";

export const ASSESSMENT_DATA_SINGLE_INDEPENDENT: IER12FullTimeAssessment = {
  studentTotalFederalContribution: 14321.963333,
  studentTotalProvincialContribution: 2321,
  totalProvincialContribution: 2000,
  parentAssessedContribution: undefined,
  partnerAssessedContribution: undefined,
  livingAllowance: 3366.66666,
  alimonyOrChildSupport: 987.45666,
  totalAssessedCost: 12000.01,
  totalAssessmentNeed: 23789.65,
  weeks: 50,
  secondResidenceCost: 215.15,
  provincialAssessmentNeed: 1500,
};

export const ASSESSMENT_DATA_SINGLE_DEPENDENT: IER12FullTimeAssessment = {
  studentTotalFederalContribution: 19639,
  studentTotalProvincialContribution: 12321,
  totalProvincialContribution: 3000,
  parentAssessedContribution: 160.000001,
  partnerAssessedContribution: undefined,
  livingAllowance: 700.45,
  alimonyOrChildSupport: undefined,
  totalAssessedCost: 6500.4,
  totalAssessmentNeed: 45999.9999,
  weeks: 19,
  parentalDiscretionaryContribution: 200.15,
  secondResidenceCost: undefined,
  provincialAssessmentNeed: 1600,
};

export const ASSESSMENT_DATA_MARRIED: IER12FullTimeAssessment = {
  studentTotalFederalContribution: 96390,
  studentTotalProvincialContribution: 231,
  totalProvincialContribution: 4000,
  parentAssessedContribution: undefined,
  partnerAssessedContribution: 65.78999,
  livingAllowance: 1500.55555,
  alimonyOrChildSupport: undefined,
  totalAssessedCost: 6543,
  totalAssessmentNeed: 9876.1223,
  weeks: 19,
  secondResidenceCost: 215.15,
  provincialAssessmentNeed: 1700,
};
