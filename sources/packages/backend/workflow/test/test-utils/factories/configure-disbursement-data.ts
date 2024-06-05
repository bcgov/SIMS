import { ConfigureDisbursementData } from "workflow/test/models";

/**
 * Create fake data for configure disbursement part time workflow.
 * @param programYear program year.
 * @returns configure disbursement data.
 */
export function createFakeConfigureDisbursementPartTimeData(
  programYear: string,
): ConfigureDisbursementData {
  const [, programEndYear] = programYear.split("-");
  return {
    offeringStudyStartDate: `${programEndYear}-02-01`,
    offeringStudyEndDate: `${programEndYear}-05-24`,
    offeringWeeks: 17,
    awardEligibilityCSLP: true,
    awardEligibilityCSGP: true,
    awardEligibilityCSGD: true,
    awardEligibilityCSPT: true,
    awardEligibilityBCAG: true,
    awardEligibilitySBSD: true,
    finalFederalAwardNetCSLPAmount: 1000,
    finalFederalAwardNetCSGPAmount: 2000,
    finalFederalAwardNetCSGDAmount: 3000,
    finalFederalAwardNetCSPTAmount: 4000,
    finalProvincialAwardNetBCAGAmount: 5000,
    finalProvincialAwardNetSBSDAmount: 6000,
  };
}
