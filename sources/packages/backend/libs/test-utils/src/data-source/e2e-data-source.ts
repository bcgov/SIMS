import { SFASPartTimeApplicationRecord } from "@sims/integrations/sfas-integration/sfas-files/sfas-part-time-application-record";
import {
  Application,
  ApplicationException,
  ApplicationExceptionRequest,
  ApplicationStudentFile,
  COEDeniedReason,
  CRAIncomeVerification,
  DesignationAgreement,
  DesignationAgreementLocation,
  DisbursementFeedbackErrors,
  DisbursementOveraward,
  DisbursementReceipt,
  DisbursementSchedule,
  DisbursementValue,
  EducationProgram,
  EducationProgramOffering,
  FederalRestriction,
  Institution,
  InstitutionLocation,
  InstitutionRestriction,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  MSFAANumber,
  Note,
  PIRDeniedReason,
  ProgramYear,
  QueueConfiguration,
  ReportConfig,
  Restriction,
  SFASApplication,
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
} from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";

export function createE2EDataSources(dataSource: DataSource): E2EDataSources {
  return {
    dataSource,
    application: dataSource.getRepository(Application),
    applicationExceptionRequest: dataSource.getRepository(
      ApplicationExceptionRequest,
    ),
    applicationException: dataSource.getRepository(ApplicationException),
    applicationStudentFile: dataSource.getRepository(ApplicationStudentFile),
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
    disbursementSchedule: dataSource.getRepository(DisbursementSchedule),
    disbursementValue: dataSource.getRepository(DisbursementValue),
    educationProgram: dataSource.getRepository(EducationProgram),
    educationProgramOffering: dataSource.getRepository(
      EducationProgramOffering,
    ),
    federalRestriction: dataSource.getRepository(FederalRestriction),
    institution: dataSource.getRepository(Institution),
    institutionLocation: dataSource.getRepository(InstitutionLocation),
    institutionRestriction: dataSource.getRepository(InstitutionRestriction),
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
    sfasIndividual: dataSource.getRepository(SFASIndividual),
    sfasPartTimeApplicationRecord: dataSource.getRepository(
      SFASPartTimeApplicationRecord,
    ),
    sfasRestriction: dataSource.getRepository(SFASRestriction),
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
  };
}

export interface E2EDataSources {
  dataSource: DataSource;
  application: Repository<Application>;
  applicationExceptionRequest: Repository<ApplicationExceptionRequest>;
  applicationException: Repository<ApplicationException>;
  applicationStudentFile: Repository<ApplicationStudentFile>;
  coeDeniedReason: Repository<COEDeniedReason>;
  craIncomeVerification: Repository<CRAIncomeVerification>;
  designationAgreement: Repository<DesignationAgreement>;
  designationAgreementLocation: Repository<DesignationAgreementLocation>;
  disbursementFeedbackErrors: Repository<DisbursementFeedbackErrors>;
  disbursementOveraward: Repository<DisbursementOveraward>;
  disbursementReceipt: Repository<DisbursementReceipt>;
  disbursementSchedule: Repository<DisbursementSchedule>;
  disbursementValue: Repository<DisbursementValue>;
  educationProgram: Repository<EducationProgram>;
  educationProgramOffering: Repository<EducationProgramOffering>;
  federalRestriction: Repository<FederalRestriction>;
  institution: Repository<Institution>;
  institutionLocation: Repository<InstitutionLocation>;
  institutionRestriction: Repository<InstitutionRestriction>;
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
  sfasPartTimeApplicationRecord: Repository<SFASPartTimeApplicationRecord>;
  sfasRestriction: Repository<SFASRestriction>;
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
}
