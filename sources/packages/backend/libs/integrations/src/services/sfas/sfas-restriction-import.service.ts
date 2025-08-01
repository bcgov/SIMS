import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, Raw, Repository } from "typeorm";
import {
  DataModelService,
  Restriction,
  SFASRestriction,
  Student,
  SFASRestrictionMap,
  RestrictionType,
  RestrictionActionType,
  RestrictionNotificationType,
  StudentRestriction,
} from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { getUTC, getISODateOnlyString, getSQLFileData } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import { SFASRestrictionRecord } from "../../sfas-integration/sfas-files/sfas-restriction-record";
import { NotificationActionsService, SystemUsersService } from "@sims/services";
import { InjectRepository } from "@nestjs/typeorm";

const SFAS_RESTRICTIONS_RAW_SQL_FOLDER = "sfas-restrictions";

/**
 * Manages the data related to student’s Provincial Restrictions in SFAS.
 * No Federal restrictions is present because SIMS will
 * process the Federal Restriction file on a regular basis.
 */
@Injectable()
export class SFASRestrictionImportService
  extends DataModelService<SFASRestriction>
  implements SFASDataImporter
{
  private readonly bulkInsertSFASMappedRestrictionsSQL: string;
  private readonly bulkInsertSFASResolvedRestrictionsSQL: string;
  constructor(
    private readonly dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
    private readonly notificationActionsService: NotificationActionsService,
    @InjectRepository(Restriction)
    private readonly restrictionRepo: Repository<Restriction>,
    @InjectRepository(SFASRestrictionMap)
    private readonly sfasRestrictionMapRepo: Repository<SFASRestrictionMap>,
  ) {
    super(dataSource.getRepository(SFASRestriction));
    this.bulkInsertSFASMappedRestrictionsSQL = getSQLFileData(
      "Bulk-insert-sfas-mapped-restrictions.sql",
      SFAS_RESTRICTIONS_RAW_SQL_FOLDER,
    );
    this.bulkInsertSFASResolvedRestrictionsSQL = getSQLFileData(
      "Bulk-insert-sfas-resolved-restrictions.sql",
      SFAS_RESTRICTIONS_RAW_SQL_FOLDER,
    );
  }

  /**
   * Ensures that all the legacy only restrictions that are present in the
   * sfas_restrictions_map table are also present in the restrictions table.
   */
  private async ensureLegacyOnlyRestrictionsExists(): Promise<void> {
    // Create the query to identify the missing restriction codes to be inserted.
    const existingRestrictionCodes = this.restrictionRepo
      .createQueryBuilder("restriction")
      .select("restriction.restrictionCode")
      .getSql();
    const missingLegacyOnlyRestrictions =
      await this.sfasRestrictionMapRepo.find({
        select: { code: true, legacyCode: true },
        where: {
          code: Raw(
            (codeColumn) =>
              `${codeColumn} NOT IN (${existingRestrictionCodes})`,
          ),
          isLegacyOnly: true,
        },
      });
    if (missingLegacyOnlyRestrictions.length) {
      // Convert the missing legacy-only-restrictions to be inserted.
      const restrictionsToInsert = missingLegacyOnlyRestrictions.map(
        (missingRestriction) => {
          const newRestriction = new Restriction();
          newRestriction.restrictionType = RestrictionType.Provincial;
          newRestriction.restrictionCode = missingRestriction.code;
          newRestriction.description = `Legacy System Restriction (${missingRestriction.legacyCode})`;
          newRestriction.restrictionCategory = "Other";
          newRestriction.actionType = [
            RestrictionActionType.StopFullTimeDisbursement,
            RestrictionActionType.StopPartTimeDisbursement,
          ];
          newRestriction.notificationType = RestrictionNotificationType.Error;
          newRestriction.isLegacy = true;
          newRestriction.creator = this.systemUsersService.systemUser;
          return newRestriction;
        },
      );
      // Insert all missing restriction in a bulk operation.
      await this.restrictionRepo.insert(restrictionsToInsert);
    }
  }

  /**
   * Bulk operation to insert student restrictions from SFAS restrictions data.
   */
  async insertStudentRestrictions(): Promise<void> {
    try {
      await this.ensureLegacyOnlyRestrictionsExists();
      const creator = this.systemUsersService.systemUser;
      const referenceDate = new Date();
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        // Insert the mapped restrictions and active restrictions.
        await transactionalEntityManager.query(
          this.bulkInsertSFASMappedRestrictionsSQL,
          [creator.id, referenceDate],
        );
        // Resolved restrictions must be executed after the active restrictions
        // are inserted by the previous query are processed.
        // The resolved restrictions should not be inserted if there is already
        // one restriction of the same mapped code for the student (active or not).
        // Currently only SSR and SSRN mapped codes are considered.
        await transactionalEntityManager.query(
          this.bulkInsertSFASResolvedRestrictionsSQL,
          [creator.id, referenceDate],
        );
        const processedUpdatePromise = transactionalEntityManager
          .getRepository(SFASRestriction)
          .update(
            { processed: false },
            { processed: true, updatedAt: referenceDate },
          );
        const notificationsPromise =
          this.generateLegacyRestrictionNotifications(
            transactionalEntityManager,
            referenceDate,
          );
        await Promise.all([processedUpdatePromise, notificationsPromise]);
      });
    } catch (error) {
      throw new Error(
        "Error while inserting student restrictions imported from SFAS.",
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Creates notifications for newly created legacy student restrictions.
   * @param entityManager entity manager to execute in transaction.
   * @param referenceDate date used to filter the restrictions created after this date.
   */
  private async generateLegacyRestrictionNotifications(
    entityManager: EntityManager,
    referenceDate: Date,
  ): Promise<void> {
    const studentIDAlias = "studentId";
    const studentsIDsWithNewLegacyRestrictions = await entityManager
      .getRepository(StudentRestriction)
      .createQueryBuilder("studentRestriction")
      .distinct()
      .select("studentRestriction.student.id", studentIDAlias)
      .innerJoin("studentRestriction.restriction", "restriction")
      .where("studentRestriction.createdAt = :referenceDate", {
        referenceDate,
      })
      .andWhere("restriction.isLegacy = true")
      .getRawMany<{ [studentIDAlias]: number }>();
    if (!studentsIDsWithNewLegacyRestrictions.length) {
      return;
    }
    const studentIds = studentsIDsWithNewLegacyRestrictions.map(
      (restriction) => restriction[studentIDAlias],
    );
    await this.createLegacyRestrictionNotifications(studentIds, entityManager);
  }

  /**
   * Import a record from SFAS. This method will be invoked by SFAS
   * import processing service when the record type is detected as
   * RecordTypeCodes.RestrictionDataRecord.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    // The insert of SFAS record always comes from an external source through integration.
    // Hence all the date fields are parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    const sfasRestriction = new SFASRestrictionRecord(record.line);
    const restriction = new SFASRestriction();
    restriction.id = sfasRestriction.restrictionId;
    restriction.individualId = sfasRestriction.individualId;
    restriction.code = sfasRestriction.code;
    restriction.effectiveDate = getISODateOnlyString(
      sfasRestriction.effectiveDate,
    );
    restriction.removalDate = getISODateOnlyString(sfasRestriction.removalDate);
    restriction.extractedAt = getUTC(extractedDate);
    restriction.processed = false;
    await this.repo.save(restriction, { reload: false, transaction: false });
  }

  /**
   * Create notifications for newly created legacy student restrictions for the ministry.
   * @param studentIds student ids for which the legacy restriction notification needs to be sent.
   * @param entityManager entity manager to execute in transaction.
   */
  private async createLegacyRestrictionNotifications(
    studentIds: number[],
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    const students = await entityManager.getRepository(Student).find({
      select: {
        birthDate: true,
        user: { id: true, firstName: true, lastName: true, email: true },
      },
      relations: { user: true },
      where: { id: In(studentIds) },
    });
    const notifications = students.map((student) => ({
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      userId: auditUser.id,
      email: student.user.email,
      birthDate: new Date(student.birthDate),
    }));
    await this.notificationActionsService.saveLegacyRestrictionAddedNotification(
      notifications,
      auditUser.id,
      entityManager,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
