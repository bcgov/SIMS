import { Injectable } from "@nestjs/common";
import { DataModelService } from "../../database/data.model.service";
import { FederalRestriction } from "../../database/entities";
import { Connection, EntityManager } from "typeorm";
import { getSQLFileData } from "src/utilities";

const FEDERAL_RESTRICTIONS_RAW_SQL_FOLDER = "RawSQL/FederalRestrictions";

/**
 * Service layer for Federal Restrictions.
 * Federal restrictions are imported into the system as a full snapshot of
 * all restrictions for entire Canada. This services manages the table that receives all these
 * federal restrictions data to then process more efficiently the update of the
 * sims.student_restrictions table (table that contains provincial and federal restrictions).
 */
@Injectable()
export class FederalRestrictionService extends DataModelService<FederalRestriction> {
  private readonly bulkUpdateStudentIdSQL: string;
  private readonly bulkInsertNewRestrictionsSQL: string;
  private readonly bulkDeactivateRestrictionsSQL: string;
  private readonly bulkUpdateActiveRestrictionsSQL: string;

  constructor(private readonly connection: Connection) {
    super(connection.getRepository(FederalRestriction));
    this.bulkUpdateStudentIdSQL = getSQLFileData(
      "Bulk-update-students-foreign-key.sql",
      FEDERAL_RESTRICTIONS_RAW_SQL_FOLDER,
    );
    this.bulkInsertNewRestrictionsSQL = getSQLFileData(
      "Bulk-insert-new-restrictions.sql",
      FEDERAL_RESTRICTIONS_RAW_SQL_FOLDER,
    );
    this.bulkDeactivateRestrictionsSQL = getSQLFileData(
      "Bulk-deactivate-restrictions.sql",
      FEDERAL_RESTRICTIONS_RAW_SQL_FOLDER,
    );
    this.bulkUpdateActiveRestrictionsSQL = getSQLFileData(
      "Bulk-update-active-restrictions.sql",
      FEDERAL_RESTRICTIONS_RAW_SQL_FOLDER,
    );
  }

  async resetFederalRestrictionsTable(manager: EntityManager): Promise<any> {
    await manager.query(
      `TRUNCATE TABLE ${
        this.connection.getMetadata(FederalRestriction).tablePath
      }`,
    );
  }

  async bulkUpdateStudentsForeignKey(manager: EntityManager): Promise<any> {
    await manager.query(this.bulkUpdateStudentIdSQL);
  }

  async bulkInsertNewRestrictions(manager: EntityManager): Promise<any> {
    await manager.query(this.bulkInsertNewRestrictionsSQL);
  }

  async bulkDeactivateRestrictions(manager: EntityManager): Promise<any> {
    await manager.query(this.bulkDeactivateRestrictionsSQL);
  }

  async bulkUpdateActiveRestrictions(manager: EntityManager): Promise<any> {
    await manager.query(this.bulkUpdateActiveRestrictionsSQL);
  }
}
