import { COEStatus, DisbursementScheduleStatus } from "@sims/sims-db";
import {
  StringBuilder,
  emptyNumberFiller,
  emptyStringFiller,
} from "@sims/utilities";
import {
  ApplicationStatusCode,
  DATE_FORMAT,
  IER12FileLine,
  IERAddressInfo,
  NUMBER_FILLER,
  SPACE_FILLER,
  YNFlag,
} from "./models/ier12-integration.model";
import { FullTimeAwardTypes } from "@sims/integrations/models";

/**
 * Record of a IER12 file.
 * The documentation about it is available on the document
 * 'SIMSSFAS - Institution File layouts In Analysis Folder'.
 * TODO:All the fields which are pending for the analysis are marked as optional.
 * During the implementation once after analysis is complete, please evaluate if the field is still optional.
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
  // Analysis pending for the field.
  studentMaritalStatusCode?: string;
  // Analysis pending for the field.
  studentDisabilityStatusCode?: string;
  // Analysis pending for the field.
  applicationDisabilityStatusFlag?: string;
  addressInfo: IERAddressInfo;
  programName: string;
  programDescription: string;
  credentialType: string;
  fieldOfStudyCode: number;
  // Analysis pending for the field.
  areaOfStudyCode?: string;
  // Analysis pending for the field.
  levelOfStudyCode?: string;
  currentProgramYear: number;
  cipCode: string;
  nocCode?: string;
  sabcCode?: string;
  institutionProgramCode?: string;
  programLength: number;
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
  // Analysis pending for the field.
  federalDefaultFlag?: string;
  provincialOverawardFlag: YNFlag;
  federalOverawardFlag: YNFlag;
  restrictionFlag: YNFlag;
  scholasticStandingEffectiveDate: Date;
  // Analysis pending for the field.
  scholasticStandingCode?: string;
  assessmentDate: Date;
  withdrawalDate: Date;
  // Analysis pending for the field.
  applicantAndPartnerExpectedContribution?: number;
  // Analysis pending for the field.
  parentExpectedContribution?: number;
  // Analysis pending for the field.
  totalExpectedContribution?: number;
  // Analysis pending for the field.
  dependantChildQuantity?: number;
  // Analysis pending for the field.
  dependantChildInDaycareQuantity?: number;
  // Analysis pending for the field.
  dependentInfantQuantity?: number;
  // Analysis pending for the field.
  dependantOtherQuantity?: number;
  // Analysis pending for the field.
  dependantPostSecondaryQuantity?: number;
  // Analysis pending for the field.
  totalDependantQuantity?: number;
  // Analysis pending for the field.
  familyMembersQuantity?: number;
  // Analysis pending for the field.
  parent1Flag?: string;
  // Analysis pending for the field.
  parent2Flag?: string;
  partnerFlag: YNFlag;
  parentalAssets?: number;
  // Analysis pending for the field.
  parentalAssetsExpectedContribution?: number;
  // Analysis pending for the field.
  parentalIncomeExpectedContribution?: number;
  // Analysis pending for the field.
  parentalVoluntaryContribution?: number;
  // Analysis pending for the field.
  parentalDiscretionaryIncome?: number;
  // Analysis pending for the field.
  parentalDiscretionaryAnnualIncomeFormulaResult?: number;
  // Analysis pending for the field.
  studentLivingAtHomeFlag?: string;
  // Analysis pending for the field.
  partnerInSchoolFlag?: string;
  // Analysis pending for the field.
  otherEducationalExpenses?: number;
  // Analysis pending for the field.
  totalEducationalExpenses?: number;
  // Analysis pending for the field.
  extraLocalTransportationCosts?: number;
  // Analysis pending for the field.
  extraShelterCosts?: number;
  // Analysis pending for the field.
  dependantLivingAllowance?: number;
  // Analysis pending for the field.
  studentLivingAllowance?: number;
  // Analysis pending for the field.
  totalLivingAllowance?: number;
  // Analysis pending for the field.
  alimonyCosts?: number;
  // Analysis pending for the field.
  otherDiscretionaryCosts?: number;
  // Analysis pending for the field.
  returnTransportationCosts?: number;
  // Analysis pending for the field.
  partnerStudentLoanPaymentCosts?: number;
  // Analysis pending for the field.
  childcareCosts?: number;
  // Analysis pending for the field.
  totalNonEducationalCosts?: number;
  // Analysis pending for the field.
  totalExpenses?: number;
  // Analysis pending for the field.
  assessedNeed?: number;
  // Analysis pending for the field.
  studentEligibleAward?: number;
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
  // Analysis pending for the field.
  applicationEventCode?: string;
  // Analysis pending for the field.
  applicationEventDate?: Date;
  // Analysis pending for the field.
  documentProducedDate?: Date;
  coeStatus: COEStatus;
  disbursementScheduleStatus: DisbursementScheduleStatus;
  earliestDateOfDisbursement: Date;
  dateOfDisbursement?: Date;
  // Analysis pending for the field.
  disbursementExpiryDate?: Date;
  disbursementCancelDate: Date;
  /**
   * Disbursement funding type and funding amount in a key value format.
   * last 2 digits in funding amount holds the decimal value.
   * e.g. `{"CSLF":100000,"BCSL":150000}` which represents `{"CSLF":1000.00,"BCSL":1500.00}`
   */
  fundingDetails: Record<string, number>;

  getFixedFormat(): string {
    const record = new StringBuilder();
    record.appendWithStartFiller(this.assessmentId, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.disbursementId, 10, NUMBER_FILLER);
    record.append(this.applicationNumber, 10);
    record.appendWithEndFiller(
      emptyStringFiller(this.institutionStudentNumber),
      12,
      SPACE_FILLER,
    );
    record.append(this.sin, 9);
    record.appendWithEndFiller(this.studentLastName, 25, SPACE_FILLER);
    record.appendWithEndFiller(
      emptyStringFiller(this.studentGivenName),
      15,
      SPACE_FILLER,
    );
    record.appendDate(this.studentBirthDate, DATE_FORMAT);
    record.appendWithEndFiller(this.studentGroupCode, 4, SPACE_FILLER);
    record.appendWithEndFiller(
      emptyStringFiller(this.studentMaritalStatusCode),
      4,
      SPACE_FILLER,
    );
    record.appendWithEndFiller(
      emptyStringFiller(this.studentDisabilityStatusCode),
      4,
      SPACE_FILLER,
    );
    record.appendWithEndFiller(
      emptyStringFiller(this.applicationDisabilityStatusFlag),
      1,
      SPACE_FILLER,
    );
    record.appendWithEndFiller(this.addressInfo.addressLine1, 25, SPACE_FILLER);
    record.appendWithEndFiller(
      emptyStringFiller(this.addressInfo.addressLine2),
      25,
      SPACE_FILLER,
    );
    record.appendWithEndFiller(this.addressInfo.city, 25, SPACE_FILLER);
    record.appendWithEndFiller(this.addressInfo.provinceState, 4, SPACE_FILLER);
    record.appendWithEndFiller(this.addressInfo.postalCode, 16, SPACE_FILLER);
    record.appendWithEndFiller(this.programName, 25, SPACE_FILLER);
    record.appendWithEndFiller(this.programDescription, 50, SPACE_FILLER);
    record.appendWithEndFiller(this.credentialType, 25, SPACE_FILLER);
    record.appendWithStartFiller(this.fieldOfStudyCode, 4, NUMBER_FILLER);
    record.appendWithEndFiller(
      emptyStringFiller(this.areaOfStudyCode),
      4,
      SPACE_FILLER,
    );
    record.appendWithEndFiller(
      emptyStringFiller(this.levelOfStudyCode),
      4,
      SPACE_FILLER,
    );
    record.appendWithStartFiller(this.currentProgramYear, 2, NUMBER_FILLER);
    record.append(this.cipCode, 6);
    record.appendWithStartFiller(this.nocCode ?? 0, 5, NUMBER_FILLER); // NOC code can only be number in program.
    record.appendWithEndFiller(
      emptyStringFiller(this.sabcCode),
      4,
      SPACE_FILLER,
    );
    record.appendWithEndFiller(
      emptyStringFiller(this.institutionProgramCode),
      25,
      SPACE_FILLER,
    );
    record.append(this.programLength, 1);
    record.appendDate(this.studyStartDate, DATE_FORMAT);
    record.appendDate(this.studyEndDate, DATE_FORMAT);
    record.appendWithStartFiller(this.tuitionFees, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.booksAndSuppliesCost, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.mandatoryFees, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.exceptionExpenses, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.totalFundedWeeks, 2, NUMBER_FILLER);
    record.append(this.courseLoad, 3);
    record.append(this.offeringIntensityIndicator, 1);
    record.appendDate(this.applicationSubmittedDate, DATE_FORMAT);
    record.append(this.programYear, 8);
    record.append(this.applicationStatusCode, 4);
    record.appendDate(this.applicationStatusDate, DATE_FORMAT);
    record.appendWithStartFiller(this.cslAmount, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.bcslAmount, 10, NUMBER_FILLER);
    record.appendWithStartFiller(this.epAmount, 10, NUMBER_FILLER);
    record.append(this.provincialDefaultFlag, 1);
    record.append(emptyStringFiller(this.federalDefaultFlag, SPACE_FILLER), 1);
    record.append(this.provincialOverawardFlag, 1);
    record.append(this.federalOverawardFlag, 1);
    record.append(this.restrictionFlag, 1);
    record.appendDate(this.scholasticStandingEffectiveDate, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.appendWithEndFiller(
      emptyStringFiller(this.scholasticStandingCode),
      4,
      SPACE_FILLER,
    );
    record.appendDate(this.assessmentDate, DATE_FORMAT);
    record.appendDate(this.withdrawalDate, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.appendWithStartFiller(
      emptyNumberFiller(this.applicantAndPartnerExpectedContribution),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.parentExpectedContribution),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.totalExpectedContribution),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.dependantChildQuantity),
      3,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.dependantChildInDaycareQuantity),
      3,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.dependentInfantQuantity),
      3,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.dependantOtherQuantity),
      3,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.dependantPostSecondaryQuantity),
      3,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.totalDependantQuantity),
      3,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.familyMembersQuantity),
      3,
      NUMBER_FILLER,
    );
    record.append(emptyStringFiller(this.parent1Flag, SPACE_FILLER), 1);
    record.append(emptyStringFiller(this.parent2Flag, SPACE_FILLER), 1);
    record.append(this.partnerFlag, 1);
    record.appendWithStartFiller(this.parentalAssets, 10, NUMBER_FILLER);
    record.appendWithStartFiller(
      emptyNumberFiller(this.parentalAssetsExpectedContribution),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.parentalIncomeExpectedContribution),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.parentalVoluntaryContribution),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.parentalDiscretionaryIncome),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.parentalDiscretionaryAnnualIncomeFormulaResult),
      10,
      NUMBER_FILLER,
    );
    record.append(
      emptyStringFiller(this.studentLivingAtHomeFlag, SPACE_FILLER),
      1,
    );
    record.append(emptyStringFiller(this.partnerInSchoolFlag, SPACE_FILLER), 1);
    record.appendWithStartFiller(
      emptyNumberFiller(this.otherEducationalExpenses),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.totalEducationalExpenses),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.extraLocalTransportationCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.extraShelterCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.dependantLivingAllowance),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.studentLivingAllowance),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.totalLivingAllowance),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.alimonyCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.otherDiscretionaryCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.returnTransportationCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.partnerStudentLoanPaymentCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.childcareCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.totalNonEducationalCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.totalExpenses),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.assessedNeed),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.studentEligibleAward),
      10,
      NUMBER_FILLER,
    );
    record.append(emptyStringFiller(this.mssAssessedNeedFlag, SPACE_FILLER), 1);
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssAssessedNeed),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssAssessedNeedNormalOrAppeal),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssChildcareCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssTuitionAndSupplies),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssMiscCostsAllowance),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssTransportCostsAllowance),
      10,
      NUMBER_FILLER,
    );
    record.appendWithStartFiller(
      emptyNumberFiller(this.mssExtraTransportCosts),
      10,
      NUMBER_FILLER,
    );
    record.appendWithEndFiller(
      emptyStringFiller(this.applicationEventCode),
      4,
      SPACE_FILLER,
    );
    record.appendDate(this.applicationEventDate, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.appendDate(this.documentProducedDate, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.appendWithEndFiller(this.coeStatus, 10, SPACE_FILLER);
    record.appendWithEndFiller(
      this.disbursementScheduleStatus,
      10,
      SPACE_FILLER,
    );
    record.appendDate(this.earliestDateOfDisbursement, DATE_FORMAT);
    record.appendDate(this.dateOfDisbursement, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.appendDate(this.disbursementExpiryDate, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.appendDate(this.disbursementCancelDate, DATE_FORMAT, {
      filler: SPACE_FILLER,
    });
    record.append(FullTimeAwardTypes.CSLF, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.CSLF]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.BCSL, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.BCSL]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.CSGP, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.CSGP]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.CSGD, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.CSGD]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.CSGF, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.CSGF]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.CSGT, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.CSGT]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.BCAG, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.BCAG]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.SBSD, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.SBSD]),
      10,
      NUMBER_FILLER,
    );
    record.append(FullTimeAwardTypes.BGPD, 4);
    record.appendWithStartFiller(
      emptyNumberFiller(this.fundingDetails[FullTimeAwardTypes.BGPD]),
      10,
      NUMBER_FILLER,
    );
    return record.toString();
  }
}
