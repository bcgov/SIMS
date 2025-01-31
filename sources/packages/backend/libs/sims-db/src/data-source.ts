import { DataSource } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import {
  Announcement,
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
  ApplicationOfferingChangeRequest,
  StudentLoanBalance,
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
} from "./entities";
import { ClusterNode, ClusterOptions, RedisOptions } from "ioredis";
import {
  CONNECTION_POOL_MAX_CONNECTIONS,
  CONNECTION_REQUEST_TIMEOUT,
  ORM_CACHE_LIFETIME,
  ORM_CACHE_REDIS_COMMAND_TIMEOUT,
  ORM_CACHE_REDIS_RETRY_INTERVAL,
} from "@sims/utilities";
import { ConfigService } from "@sims/utilities/config";
import { PoolConfig } from "pg";

interface ConnectionOptions extends PostgresConnectionOptions {
  extra: PoolConfig;
}
interface ORMCacheConfig {
  type: "database" | "ioredis" | "ioredis/cluster";
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

export const ormConfig: ConnectionOptions = {
  type: "postgres",
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  database: process.env.POSTGRES_DB || "aest",
  username: process.env.POSTGRES_USER || "admin",
  password: process.env.POSTGRES_PASSWORD,
  schema: process.env.DB_SCHEMA || "sims",
  cache: getORMCacheConfig(),
  synchronize: false,
  extra: {
    max: CONNECTION_POOL_MAX_CONNECTIONS,
    connectionTimeoutMillis: CONNECTION_REQUEST_TIMEOUT,
  },
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

  const retryStrategy = (times: number) => {
    const delay = Math.min(times * 100, ORM_CACHE_REDIS_RETRY_INTERVAL);
    return delay;
  };

  if (config.redis.redisStandaloneMode) {
    return {
      type: "ioredis",
      options: {
        host: config.redis.redisHost,
        port: config.redis.redisPort,
        password: config.redis.redisPassword,
        commandTimeout: ORM_CACHE_REDIS_COMMAND_TIMEOUT,
        retryStrategy,
      },
      ignoreErrors: true,
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
          commandTimeout: ORM_CACHE_REDIS_COMMAND_TIMEOUT,
        },
        clusterRetryStrategy: retryStrategy,
      },
    },
    ignoreErrors: true,
    duration: ORM_CACHE_LIFETIME,
  };
}

export const simsDataSource = new DataSource({
  ...ormConfig,
  logging: ["error", "warn", "info"],
});

export const DBEntities = [
  Announcement,
  ApplicationExceptionRequest,
  ApplicationException,
  ApplicationStudentFile,
  ApplicationRestrictionBypass,
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
  SFASRestrictionMap,
  SFASApplicationDependant,
  SFASApplicationDisbursement,
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
  ApplicationOfferingChangeRequest,
  StudentLoanBalance,
  ECertFeedbackError,
  CASSupplier,
  CASInvoiceBatch,
  CASInvoice,
  CASInvoiceDetail,
  CASDistributionAccount,
  BetaUsersAuthorizations,
  SFASBridgeLog,
];
