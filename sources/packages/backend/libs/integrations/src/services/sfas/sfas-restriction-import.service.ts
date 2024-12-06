import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In, Not, Raw, Repository } from "typeorm";
import {
  DataModelService,
  Restriction,
  SFASRestriction,
  Student,
  SFASRestrictionMap,
  RestrictionType,
  RestrictionActionType,
  RestrictionNotificationType,
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
  }

  /**
   * Ensures that all the legacy only restrictions that are present in the
   * sfas_restrictions_map table are also present in the restrictions table.
   */
  private async ensureLegacyOnlyRestrictionsExists(): Promise<void> {
    // Create the query to identify the missing restriction codes to be inserted.
    const existingRestrictionCodes = this.restrictionRepo
      .createQueryBuilder("restriction")
      .select("restriction.code")
      .getSql();
    const missingLegacyOnlyRestrictions =
      await this.sfasRestrictionMapRepo.find({
        select: { code: true, legacyCode: true },
        where: {
          code: Not(In(Raw(existingRestrictionCodes))),
          isLegacyOnly: true,
        },
      });
    if (missingLegacyOnlyRestrictions.length) {
      // Convert the missing legacy-only-restrictions to be created.
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
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const bulkInsertSFASMappedRestrictionsPromise =
          transactionalEntityManager.query(
            this.bulkInsertSFASMappedRestrictionsSQL,
            [creator.id],
          );
        const [bulkInsertLegacyRestrictions] = await Promise.all([
          bulkInsertSFASMappedRestrictionsPromise,
        ]);
        await transactionalEntityManager
          .getRepository(SFASRestriction)
          .update(
            { processed: false },
            { processed: true, updatedAt: new Date() },
          );
        const bulkInsertLegacyRestrictionStudentIds =
          bulkInsertLegacyRestrictions.map(
            (restriction: { student_id: number }) => restriction.student_id,
          );
        await this.createLegacyRestrictionNotifications(
          bulkInsertLegacyRestrictionStudentIds,
          transactionalEntityManager,
        );
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
      userId: student.user.id,
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
