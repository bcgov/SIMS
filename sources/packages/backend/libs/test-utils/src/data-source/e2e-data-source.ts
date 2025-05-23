import {
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationOfferingChangeRequest,
  ApplicationStudentFile,
  COEDeniedReason,
  CRAIncomeVerification,
  DesignationAgreement,
  DesignationAgreementLocation,
  DisbursementFeedbackErrors,
  DisbursementOveraward,
  DisbursementReceipt,
  DisbursementReceiptValue,
  DisbursementSchedule,
  DisbursementValue,
  EducationProgram,
  EducationProgramOffering,
  FederalRestriction,
  Institution,
  InstitutionLocation,
  InstitutionRestriction,
  InstitutionType,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  MSFAANumber,
  Note,
  Notification,
  PIRDeniedReason,
  ProgramYear,
  QueueConfiguration,
  ReportConfig,
  Restriction,
  SFASApplication,
  SFASPartTimeApplications,
  SFASIndividual,
  SFASRestriction,
  SINValidation,
  SequenceControl,
  Student,
  StudentAccountApplication,
  StudentAppeal,
  StudentAppealRequest,
  StudentAssessment,
  StudentFile,
  StudentRestriction,
  StudentScholasticStanding,
  StudentUser,
  SupportingUser,
  User,
  StudentLoanBalance,
  NotificationMessage,
  ECertFeedbackError,
  CASSupplier,
  ApplicationRestrictionBypass,
  BetaUsersAuthorizations,
  SFASBridgeLog,
  SFASRestrictionMap,
  CASInvoiceBatch,
  CASInvoice,
  CASInvoiceDetail,
  CASDistributionAccount,
  SFASApplicationDependant,
  SFASApplicationDisbursement,
  InstitutionUser,
  DynamicFormConfiguration,
} from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";

/**
 * Database helper to provide easy access to all repositories as needed.
 * Intended to be used exclusively for E2E tests.
 * @param dataSource Nestjs data source that provides access to all repositories.
 * @returns database repositories.
 */
export function createE2EDataSources(dataSource: DataSource): E2EDataSources {
  return {
    dataSource,
    application: dataSource.getRepository(Application),
    applicationExceptionRequest: dataSource.getRepository(
      ApplicationExceptionRequest,
    ),
    applicationException: dataSource.getRepository(ApplicationException),
    applicationStudentFile: dataSource.getRepository(ApplicationStudentFile),
    applicationRestrictionBypass: dataSource.getRepository(
      ApplicationRestrictionBypass,
    ),
    betaUsersAuthorizations: dataSource.getRepository(BetaUsersAuthorizations),
    casSupplier: dataSource.getRepository(CASSupplier),
    casInvoiceBatch: dataSource.getRepository(CASInvoiceBatch),
    casInvoice: dataSource.getRepository(CASInvoice),
    casInvoiceDetail: dataSource.getRepository(CASInvoiceDetail),
    casDistributionAccount: dataSource.getRepository(CASDistributionAccount),
    coeDeniedReason: dataSource.getRepository(COEDeniedReason),
    craIncomeVerification: dataSource.getRepository(CRAIncomeVerification),
    designationAgreement: dataSource.getRepository(DesignationAgreement),
    designationAgreementLocation: dataSource.getRepository(
      DesignationAgreementLocation,
    ),
    disbursementFeedbackErrors: dataSource.getRepository(
      DisbursementFeedbackErrors,
    ),
    disbursementOveraward: dataSource.getRepository(DisbursementOveraward),
    disbursementReceipt: dataSource.getRepository(DisbursementReceipt),
    disbursementReceiptValue: dataSource.getRepository(
      DisbursementReceiptValue,
    ),
    disbursementSchedule: dataSource.getRepository(DisbursementSchedule),
    disbursementValue: dataSource.getRepository(DisbursementValue),
    educationProgram: dataSource.getRepository(EducationProgram),
    educationProgramOffering: dataSource.getRepository(
      EducationProgramOffering,
    ),
    federalRestriction: dataSource.getRepository(FederalRestriction),
    institution: dataSource.getRepository(Institution),
    institutionLocation: dataSource.getRepository(InstitutionLocation),
    institutionType: dataSource.getRepository(InstitutionType),
    institutionRestriction: dataSource.getRepository(InstitutionRestriction),
    institutionUser: dataSource.getRepository(InstitutionUser),
    institutionUserAuth: dataSource.getRepository(InstitutionUserAuth),
    institutionUserTypeAndRole: dataSource.getRepository(
      InstitutionUserTypeAndRole,
    ),
    msfaaNumber: dataSource.getRepository(MSFAANumber),
    note: dataSource.getRepository(Note),
    pirDeniedReason: dataSource.getRepository(PIRDeniedReason),
    programYear: dataSource.getRepository(ProgramYear),
    queueConfiguration: dataSource.getRepository(QueueConfiguration),
    reportConfig: dataSource.getRepository(ReportConfig),
    restriction: dataSource.getRepository(Restriction),
    sequenceControl: dataSource.getRepository(SequenceControl),
    sfasApplication: dataSource.getRepository(SFASApplication),
    sfasPartTimeApplications: dataSource.getRepository(
      SFASPartTimeApplications,
    ),
    sfasIndividual: dataSource.getRepository(SFASIndividual),
    sfasRestriction: dataSource.getRepository(SFASRestriction),
    sfasRestrictionMap: dataSource.getRepository(SFASRestrictionMap),
    sfasApplicationDependant: dataSource.getRepository(
      SFASApplicationDependant,
    ),
    sfasApplicationDisbursement: dataSource.getRepository(
      SFASApplicationDisbursement,
    ),
    sinValidation: dataSource.getRepository(SINValidation),
    student: dataSource.getRepository(Student),
    studentAccountApplication: dataSource.getRepository(
      StudentAccountApplication,
    ),
    studentAppeal: dataSource.getRepository(StudentAppeal),
    studentAppealRequest: dataSource.getRepository(StudentAppealRequest),
    studentAssessment: dataSource.getRepository(StudentAssessment),
    studentFile: dataSource.getRepository(StudentFile),
    studentRestriction: dataSource.getRepository(StudentRestriction),
    studentScholasticStanding: dataSource.getRepository(
      StudentScholasticStanding,
    ),
    studentUser: dataSource.getRepository(StudentUser),
    supportingUser: dataSource.getRepository(SupportingUser),
    user: dataSource.getRepository(User),
    notification: dataSource.getRepository(Notification),
    notificationMessage: dataSource.getRepository(NotificationMessage),
    applicationOfferingChangeRequest: dataSource.getRepository(
      ApplicationOfferingChangeRequest,
    ),
    studentLoanBalance: dataSource.getRepository(StudentLoanBalance),
    eCertFeedbackError: dataSource.getRepository(ECertFeedbackError),
    sfasBridgeLog: dataSource.getRepository(SFASBridgeLog),
    dynamicFormConfiguration: dataSource.getRepository(
      DynamicFormConfiguration,
    ),
  };
}

/**
 * Database repositories.
 */
export interface E2EDataSources {
  dataSource: DataSource;
  application: Repository<Application>;
  applicationExceptionRequest: Repository<ApplicationExceptionRequest>;
  applicationException: Repository<ApplicationException>;
  applicationStudentFile: Repository<ApplicationStudentFile>;
  applicationRestrictionBypass: Repository<ApplicationRestrictionBypass>;
  betaUsersAuthorizations: Repository<BetaUsersAuthorizations>;
  casSupplier: Repository<CASSupplier>;
  casInvoiceBatch: Repository<CASInvoiceBatch>;
  casInvoice: Repository<CASInvoice>;
  casInvoiceDetail: Repository<CASInvoiceDetail>;
  casDistributionAccount: Repository<CASDistributionAccount>;
  coeDeniedReason: Repository<COEDeniedReason>;
  craIncomeVerification: Repository<CRAIncomeVerification>;
  designationAgreement: Repository<DesignationAgreement>;
  designationAgreementLocation: Repository<DesignationAgreementLocation>;
  disbursementFeedbackErrors: Repository<DisbursementFeedbackErrors>;
  disbursementOveraward: Repository<DisbursementOveraward>;
  disbursementReceipt: Repository<DisbursementReceipt>;
  disbursementReceiptValue: Repository<DisbursementReceiptValue>;
  disbursementSchedule: Repository<DisbursementSchedule>;
  disbursementValue: Repository<DisbursementValue>;
  educationProgram: Repository<EducationProgram>;
  educationProgramOffering: Repository<EducationProgramOffering>;
  federalRestriction: Repository<FederalRestriction>;
  institution: Repository<Institution>;
  institutionLocation: Repository<InstitutionLocation>;
  institutionType: Repository<InstitutionType>;
  institutionRestriction: Repository<InstitutionRestriction>;
  institutionUser: Repository<InstitutionUser>;
  institutionUserAuth: Repository<InstitutionUserAuth>;
  institutionUserTypeAndRole: Repository<InstitutionUserTypeAndRole>;
  msfaaNumber: Repository<MSFAANumber>;
  note: Repository<Note>;
  pirDeniedReason: Repository<PIRDeniedReason>;
  programYear: Repository<ProgramYear>;
  queueConfiguration: Repository<QueueConfiguration>;
  reportConfig: Repository<ReportConfig>;
  restriction: Repository<Restriction>;
  sequenceControl: Repository<SequenceControl>;
  sfasApplication: Repository<SFASApplication>;
  sfasIndividual: Repository<SFASIndividual>;
  sfasPartTimeApplications: Repository<SFASPartTimeApplications>;
  sfasRestriction: Repository<SFASRestriction>;
  sfasRestrictionMap: Repository<SFASRestrictionMap>;
  sfasApplicationDependant: Repository<SFASApplicationDependant>;
  sfasApplicationDisbursement: Repository<SFASApplicationDisbursement>;
  sinValidation: Repository<SINValidation>;
  student: Repository<Student>;
  studentAccountApplication: Repository<StudentAccountApplication>;
  studentAppeal: Repository<StudentAppeal>;
  studentAppealRequest: Repository<StudentAppealRequest>;
  studentAssessment: Repository<StudentAssessment>;
  studentFile: Repository<StudentFile>;
  studentRestriction: Repository<StudentRestriction>;
  studentScholasticStanding: Repository<StudentScholasticStanding>;
  studentUser: Repository<StudentUser>;
  supportingUser: Repository<SupportingUser>;
  user: Repository<User>;
  notification: Repository<Notification>;
  notificationMessage: Repository<NotificationMessage>;
  applicationOfferingChangeRequest: Repository<ApplicationOfferingChangeRequest>;
  studentLoanBalance: Repository<StudentLoanBalance>;
  eCertFeedbackError: Repository<ECertFeedbackError>;
  sfasBridgeLog: Repository<SFASBridgeLog>;
  dynamicFormConfiguration: Repository<DynamicFormConfiguration>;
}
