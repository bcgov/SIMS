import {
  COEStatus,
  DisbursementScheduleStatus,
  StudentMaritalStatusCode,
} from "@sims/sims-db";
import { SpecializedStringBuilder } from "@sims/utilities";
import {
  ApplicationEventCode,
  ApplicationStatusCode,
  DATE_FORMAT,
  IER12FileLine,
  IERAddressInfo,
  NUMBER_FILLER,
  SPACE_FILLER,
  ScholasticStandingCode,
} from "./models/ier12-integration.model";
import { FullTimeAwardTypes, YNFlag } from "@sims/integrations/models";

/**
 * Record of a IER12 file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 * TODO:All the fields which are pending for the analysis are marked as optional and comments are added to it.
 * During the implementation once after analysis is complete, please evaluate it's data type if the field is still optional.
 */
export class IER12FileDetail implements IER12FileLine {
  assessmentId: number;
  disbursementId: number;
  applicationNumber: string;
  institutionStudentNumber?: string;
  sin: string;
  studentLastName: string;
  studentGivenName?: string;
  studentBirthDate: Date;
  studentGroupCode: "A" | "B";
  studentMaritalStatusCode: StudentMaritalStatusCode;
  studentDisabilityStatusCode: string;
  applicationDisabilityStatusFlag: YNFlag;
  addressInfo: IERAddressInfo;
  programName: string;
  programDescription: string;
  credentialType: string;
  fieldOfStudyCode: number;
  // Analysis pending for the field.
  areaOfStudyCode?: string;
  levelOfStudyCode: string;
  currentProgramYear: number;
  cipCode: string;
  nocCode?: string;
  sabcCode?: string;
  institutionProgramCode?: string;
  programLength: number;
  currentOfferingId: number;
  parentOfferingId?: number;
  studyStartDate: Date;
  studyEndDate: Date;
  tuitionFees: number;
  booksAndSuppliesCost: number;
  mandatoryFees: number;
  exceptionExpenses: number;
  totalFundedWeeks: number;
  courseLoad: number;
  offeringIntensityIndicator: string;
  applicationSubmittedDate: Date;
  programYear: string;
  applicationStatusCode: ApplicationStatusCode;
  applicationStatusDate: Date;
  cslAmount: number;
  bcslAmount: number;
  epAmount: number;
  provincialDefaultFlag: YNFlag;
  // TODO: IER.
  federalDefaultFlag?: string;
  provincialOverawardFlag: YNFlag;
  federalOverawardFlag: YNFlag;
  restrictionFlag: YNFlag;
  scholasticStandingEffectiveDate?: Date;
  scholasticStandingCode?: ScholasticStandingCode;
  assessmentDate: Date;
  withdrawalDate?: Date;
  // TODO: IER.
  applicantAndPartnerExpectedContribution: number;
  parentExpectedContribution?: number;
  totalExpectedContribution: number;
  // TODO: IER.
  dependantChildQuantity?: number;
  dependantChildInDaycareQuantity?: number;
  dependantInfantQuantity?: number;
  dependantOtherQuantity?: number;
  dependantPostSecondaryQuantity?: number;
  totalDependantQuantity?: number;
  familyMembersQuantity: number;
  parent1Flag?: YNFlag;
  parent2Flag?: YNFlag;
  partnerFlag: YNFlag;
  parentalAssets?: number;
  parentalAssetsExpectedContribution?: number;
  parentalIncomeExpectedContribution?: number;
  parentalVoluntaryContribution?: number;
  parentalDiscretionaryIncome?: number;
  parentalDiscretionaryAnnualIncomeFormulaResult?: number;
  studentLivingAtHomeFlag: YNFlag;
  // TODO: IER.
  partnerInSchoolFlag?: string;
  // Analysis pending for the field.
  otherEducationalExpenses?: number;
  totalEducationalExpenses: number;
  // TODO: IER.
  extraLocalTransportationCosts?: number;
  // TODO: IER.
  extraShelterCosts?: number;
  // TODO: IER.
  dependantLivingAllowance?: number;
  studentLivingAllowance: number;
  totalLivingAllowance: number;
  alimonyCost?: number;
  // Analysis pending for the field.
  otherDiscretionaryCosts?: number;
  // TODO: IER.
  returnTransportationCosts?: number;
  // Analysis pending for the field.
  partnerStudentLoanPaymentCosts?: number;
  childcareCost?: number;
  totalNonEducationalCost: number;
  totalExpenses: number;
  // TODO: IER.
  assessedNeed: number;
  studentEligibleAward: number;
  // Analysis pending for the field.
  mssAssessedNeedFlag?: string;
  // Analysis pending for the field.
  mssAssessedNeed?: number;
  // Analysis pending for the field.
  mssAssessedNeedNormalOrAppeal?: number;
  // Analysis pending for the field.
  mssChildcareCosts?: number;
  // Analysis pending for the field.
  mssTuitionAndSupplies?: number;
  // Analysis pending for the field.
  mssMiscCostsAllowance?: number;
  // Analysis pending for the field.
  mssTransportCostsAllowance?: number;
  // Analysis pending for the field.
  mssExtraTransportCosts?: number;
  applicationEventCode: ApplicationEventCode;
  applicationEventDate: Date;
  documentProducedDate?: Date;
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  earliestDateOfDisbursement: Date;
  dateOfDisbursement?: Date;
  // Analysis pending for the field.
  disbursementExpiryDate?: Date;
  disbursementCancelDate?: Date;
  /**
   * Disbursement funding type and funding amount in a key value format.
   * last 2 digits in funding amount holds the decimal value.
   * e.g. `{"CSLF":100000,"BCSL":150000}` which represents `{"CSLF":1000.00,"BCSL":1500.00}`
   */
  fundingDetails: Record<string, number>;

  getFixedFormat(): string {
    const record = new SpecializedStringBuilder({
      stringFiller: SPACE_FILLER,
      numberFiller: NUMBER_FILLER,
      dateFiller: SPACE_FILLER,
      dateFormat: DATE_FORMAT,
    });
    record.appendNumberWithFiller(this.assessmentId, 10);
    record.appendNumberWithFiller(this.disbursementId, 10);
    record.append(this.applicationNumber, 10);
    record.appendOptionalStringWithFiller(this.institutionStudentNumber, 12);
    record.append(this.sin, 9);
    record.appendStringWithFiller(this.studentLastName, 25);
    record.appendOptionalStringWithFiller(this.studentGivenName, 15);
    record.appendFormattedDate(this.studentBirthDate);
    record.appendStringWithFiller(this.studentGroupCode, 4);
    record.appendStringWithFiller(this.studentMaritalStatusCode, 4);
    record.append(this.studentDisabilityStatusCode);
    record.append(this.applicationDisabilityStatusFlag);
    record.appendStringWithFiller(this.addressInfo.addressLine1, 25);
    record.appendOptionalStringWithFiller(this.addressInfo.addressLine2, 25);
    record.appendStringWithFiller(this.addressInfo.city, 25);
    record.appendOptionalStringWithFiller(this.addressInfo.provinceState, 4);
    record.appendStringWithFiller(this.addressInfo.postalCode, 16);
    record.appendStringWithFiller(this.programName, 25);
    record.appendStringWithFiller(this.programDescription, 50);
    record.appendStringWithFiller(this.credentialType, 25);
    record.appendNumberWithFiller(this.fieldOfStudyCode, 4);
    record.appendOptionalStringWithFiller(this.areaOfStudyCode, 4);
    record.appendStringWithFiller(this.levelOfStudyCode, 4);
    record.appendNumberWithFiller(this.currentProgramYear, 2);
    record.append(this.cipCode, 6);
    record.appendWithStartFiller(this.nocCode ?? 0, 5, NUMBER_FILLER); // NOC code can only be number in program.
    record.appendOptionalStringWithFiller(this.sabcCode, 4);
    record.appendOptionalStringWithFiller(this.institutionProgramCode, 25);
    record.append(this.programLength, 1);
    record.appendNumberWithFiller(this.currentOfferingId, 10);
    record.appendOptionalNumberWithFiller(this.parentOfferingId, 10);
    // Currently we are sending 30 whitespace after the parent offering id.
    record.repeatAppend(SPACE_FILLER, 30);
    record.appendFormattedDate(this.studyStartDate);
    record.appendFormattedDate(this.studyEndDate);
    record.appendNumberWithFiller(this.tuitionFees, 10);
    record.appendNumberWithFiller(this.booksAndSuppliesCost, 10);
    record.appendNumberWithFiller(this.mandatoryFees, 10);
    record.appendNumberWithFiller(this.exceptionExpenses, 10);
    record.appendNumberWithFiller(this.totalFundedWeeks, 2);
    record.append(this.courseLoad, 3);
    record.append(this.offeringIntensityIndicator, 1);
    record.appendFormattedDate(this.applicationSubmittedDate);
    record.append(this.programYear, 8);
    record.append(this.applicationStatusCode, 4);
    record.appendFormattedDate(this.applicationStatusDate);
    record.appendNumberWithFiller(this.cslAmount, 10);
    record.appendNumberWithFiller(this.bcslAmount, 10);
    record.appendNumberWithFiller(this.epAmount, 10);
    record.append(this.provincialDefaultFlag, 1);
    record.appendOptionalStringWithFiller(this.federalDefaultFlag, 1);
    record.append(this.provincialOverawardFlag, 1);
    record.append(this.federalOverawardFlag, 1);
    record.append(this.restrictionFlag, 1);
    record.appendOptionalFormattedDate(this.scholasticStandingEffectiveDate);
    record.appendOptionalStringWithFiller(this.scholasticStandingCode, 4);
    record.appendFormattedDate(this.assessmentDate);
    record.appendOptionalFormattedDate(this.withdrawalDate);
    record.appendNumberWithFiller(
      this.applicantAndPartnerExpectedContribution,
      10,
    );
    record.appendOptionalNumberWithFiller(this.parentExpectedContribution, 10);
    record.appendNumberWithFiller(this.totalExpectedContribution, 10);
    record.appendOptionalNumberWithFiller(this.dependantChildQuantity, 3);
    record.appendOptionalNumberWithFiller(
      this.dependantChildInDaycareQuantity,
      3,
    );
    record.appendOptionalNumberWithFiller(this.dependantInfantQuantity, 3);
    record.appendOptionalNumberWithFiller(this.dependantOtherQuantity, 3);
    record.appendOptionalNumberWithFiller(
      this.dependantPostSecondaryQuantity,
      3,
    );
    record.appendOptionalNumberWithFiller(this.totalDependantQuantity, 3);
    record.appendNumberWithFiller(this.familyMembersQuantity, 3);
    record.appendOptionalStringWithFiller(this.parent1Flag, 1);
    record.appendOptionalStringWithFiller(this.parent2Flag, 1);
    record.append(this.partnerFlag, 1);
    record.appendNumberWithFiller(this.parentalAssets, 10);
    record.appendOptionalNumberWithFiller(
      this.parentalAssetsExpectedContribution,
      10,
    );
    record.appendOptionalNumberWithFiller(
      this.parentalIncomeExpectedContribution,
      10,
    );
    record.appendOptionalNumberWithFiller(
      this.parentalVoluntaryContribution,
      10,
    );
    record.appendOptionalNumberWithFiller(this.parentalDiscretionaryIncome, 10);
    record.appendOptionalNumberWithFiller(
      this.parentalDiscretionaryAnnualIncomeFormulaResult,
      10,
    );
    record.appendStringWithFiller(this.studentLivingAtHomeFlag, 1);
    record.appendOptionalStringWithFiller(this.partnerInSchoolFlag, 1);
    record.appendOptionalNumberWithFiller(this.otherEducationalExpenses, 10);
    record.appendNumberWithFiller(this.totalEducationalExpenses, 10);
    record.appendOptionalNumberWithFiller(
      this.extraLocalTransportationCosts,
      10,
    );
    record.appendOptionalNumberWithFiller(this.extraShelterCosts, 10);
    record.appendOptionalNumberWithFiller(this.dependantLivingAllowance, 10);
    record.appendNumberWithFiller(this.studentLivingAllowance, 10);
    record.appendNumberWithFiller(this.totalLivingAllowance, 10);
    record.appendOptionalNumberWithFiller(this.alimonyCost, 10);
    record.appendOptionalNumberWithFiller(this.otherDiscretionaryCosts, 10);
    record.appendOptionalNumberWithFiller(this.returnTransportationCosts, 10);
    record.appendOptionalNumberWithFiller(
      this.partnerStudentLoanPaymentCosts,
      10,
    );
    record.appendOptionalNumberWithFiller(this.childcareCost, 10);
    record.appendNumberWithFiller(this.totalNonEducationalCost, 10);
    record.appendNumberWithFiller(this.totalExpenses, 10);
    record.appendNumberWithFiller(this.assessedNeed, 10);
    record.appendNumberWithFiller(this.studentEligibleAward, 10);
    record.appendOptionalStringWithFiller(this.mssAssessedNeedFlag, 1);
    record.appendOptionalNumberWithFiller(this.mssAssessedNeed, 10);
    record.appendOptionalNumberWithFiller(
      this.mssAssessedNeedNormalOrAppeal,
      10,
    );
    record.appendOptionalNumberWithFiller(this.mssChildcareCosts, 10);
    record.appendOptionalNumberWithFiller(this.mssTuitionAndSupplies, 10);
    record.appendOptionalNumberWithFiller(this.mssMiscCostsAllowance, 10);
    record.appendOptionalNumberWithFiller(this.mssTransportCostsAllowance, 10);
    record.appendOptionalNumberWithFiller(this.mssExtraTransportCosts, 10);
    record.appendStringWithFiller(this.applicationEventCode, 4);
    record.appendFormattedDate(this.applicationEventDate);
    record.appendOptionalFormattedDate(this.documentProducedDate);
    record.appendStringWithFiller(this.coeStatus, 10);
    record.appendStringWithFiller(this.disbursementScheduleStatus, 10);
    record.appendFormattedDate(this.earliestDateOfDisbursement);
    record.appendOptionalFormattedDate(this.dateOfDisbursement);
    record.appendOptionalFormattedDate(this.disbursementExpiryDate);
    record.appendOptionalFormattedDate(this.disbursementCancelDate);
    record.append(this.getAwardDetails(FullTimeAwardTypes.CSLF), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.BCSL), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.CSGP), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.CSGD), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.CSGF), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.CSGT), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.BCAG), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.SBSD), 14);
    record.append(this.getAwardDetails(FullTimeAwardTypes.BGPD), 14);
    // Filler to populate the award details on 10th position.
    record.appendStringWithFiller("", 4);
    record.appendNumberWithFiller(0, 10);
    return record.toString();
  }

  /**
   * Get award details in IER12 format of a given award from funding details.
   * @param awardType award type.
   * @returns award details.
   */
  private getAwardDetails(awardType: FullTimeAwardTypes): string {
    const fundingAmount = this.fundingDetails[awardType] ?? 0;
    const fundingAmountPadded = fundingAmount
      .toString()
      .padStart(10, NUMBER_FILLER);
    return `${awardType}${fundingAmountPadded}`;
  }
}
