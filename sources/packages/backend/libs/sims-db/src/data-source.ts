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
import { ClusterNode, ClusterOptions, RedisOptions } from "ioredis";
import { ORM_CACHE_LIFETIME } from "@sims/utilities";
import { ConfigService } from "@sims/utilities/config";

interface ORMCacheConfig {
  type: "database" | "redis" | "ioredis/cluster";
  options?:
    | RedisOptions
    | {
        startupNodes: ClusterNode[];
        options?: ClusterOptions;
      };
  tableName?: string;
  duration?: number;
  ignoreErrors?: boolean;
}

export const ormConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || "aest",
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD,
  schema: process.env.DB_SCHEMA || "sims",
  cache: getORMCacheConfig(),
  synchronize: false,
};

/**
 * Get cache configuration of the ORM.
 * @returns ORM cache config.
 */
function getORMCacheConfig(): ORMCacheConfig | false {
  const config = new ConfigService();

  if (config.database.isORMCacheDisabled) {
    return false;
  }

  if (config.redis.redisStandaloneMode) {
    return {
      type: "redis",
      options: {
        host: config.redis.redisHost,
        port: config.redis.redisPort,
        password: config.redis.redisPassword,
      },
      duration: ORM_CACHE_LIFETIME,
    };
  }
  return {
    type: "ioredis/cluster",
    options: {
      startupNodes: [
        { host: config.redis.redisHost, port: config.redis.redisPort },
      ],
      options: {
        redisOptions: {
          password: config.redis.redisPassword,
        },
      },
    },
    duration: ORM_CACHE_LIFETIME,
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
