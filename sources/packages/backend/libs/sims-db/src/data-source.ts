import { DataSource } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import {
  ApplicationExceptionRequest,
  ApplicationException,
  ApplicationStudentFile,
  Application,
  COEDeniedReason,
  CRAIncomeVerification,
  DesignationAgreementLocation,
  DesignationAgreement,
  DisbursementFeedbackErrors,
  DisbursementReceiptValue,
  DisbursementReceipt,
  DisbursementSchedule,
  DisbursementValue,
  EducationProgramOffering,
  EducationProgram,
  FederalRestriction,
  InstitutionLocation,
  InstitutionRestriction,
  InstitutionType,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  InstitutionUser,
  Institution,
  MSFAANumber,
  Note,
  PIRDeniedReason,
  ProgramYear,
  ReportConfig,
  Restriction,
  SequenceControl,
  SFASApplication,
  SFASIndividual,
  SFASPartTimeApplications,
  SFASRestriction,
  SINValidation,
  StudentAccountApplication,
  StudentAppealRequest,
  StudentAppeal,
  StudentAssessment,
  StudentFile,
  StudentRestriction,
  StudentScholasticStanding,
  StudentUser,
  Student,
  SupportingUser,
  User,
  Notification,
  NotificationMessage,
  DisbursementOveraward,
  QueueConfiguration,
} from "./entities";

interface DatabaseCacheConfig {
  type: "database" | "redis" | "ioredis/cluster";
  options?: { host: string; port: number; password?: string };
  tableName?: string;
  duration?: number;
}

export const ormConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || "aest",
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD,
  schema: process.env.DB_SCHEMA || "sims",
  cache: getRedisCacheConfig(),
  synchronize: false,
};

function getRedisCacheConfig(): DatabaseCacheConfig {
  const standaloneMode = process.env.REDIS_STANDALONE_MODE;
  if (standaloneMode) {
    return {
      type: "redis",
      options: {
        host: process.env.REDIS_HOST,
        port: +process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
      },
    };
  }
  return {
    type: "ioredis/cluster",
  };
}

export const simsDataSource = new DataSource({
  ...ormConfig,
  logging: ["error", "warn", "info"],
});

export const DBEntities = [
  ApplicationExceptionRequest,
  ApplicationException,
  ApplicationStudentFile,
  Application,
  COEDeniedReason,
  CRAIncomeVerification,
  DesignationAgreementLocation,
  DesignationAgreement,
  DisbursementFeedbackErrors,
  DisbursementReceiptValue,
  DisbursementReceipt,
  DisbursementSchedule,
  DisbursementValue,
  EducationProgramOffering,
  EducationProgram,
  FederalRestriction,
  InstitutionLocation,
  InstitutionRestriction,
  InstitutionType,
  InstitutionUserAuth,
  InstitutionUserTypeAndRole,
  InstitutionUser,
  Institution,
  MSFAANumber,
  Note,
  PIRDeniedReason,
  ProgramYear,
  ReportConfig,
  Restriction,
  SequenceControl,
  SFASApplication,
  SFASIndividual,
  SFASPartTimeApplications,
  SFASRestriction,
  SINValidation,
  StudentAccountApplication,
  StudentAppealRequest,
  StudentAppeal,
  StudentAssessment,
  StudentFile,
  StudentRestriction,
  StudentScholasticStanding,
  StudentUser,
  Student,
  SupportingUser,
  User,
  Notification,
  NotificationMessage,
  DisbursementOveraward,
  QueueConfiguration,
];
