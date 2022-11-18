import { Injectable } from "@nestjs/common";
import { DataModelService, FederalRestriction } from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";
import { getSQLFileData } from "../../utilities";
import { FederalStudentRestrictionInsertedRecord } from "./models/federal-restriction.model";

const FEDERAL_RESTRICTIONS_RAW_SQL_FOLDER = "federal-restrictions";

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

  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(FederalRestriction));
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

  /**
   * Clear the federal restrictions table to release the resources and allow the insert
   * of the entire federal restrictions snapshot. The process of deleting the entire data
   * and bulk inserting again proved to be faster and more efficient.
   */
  async resetFederalRestrictionsTable(manager: EntityManager): Promise<void> {
    await manager.query(
      `TRUNCATE TABLE ${
        this.dataSource.getMetadata(FederalRestriction).tablePath
      }`,
    );
  }

  /**
   * Once the table with all federal restriction is fully imported, these
   * process executes the sequence of bulk operations to:
   * 1. Create new active restrictions;
   * 2. Deactivate restrictions that are no longer present in the federal data;
   * 3. Update the updated_at date for the active restrictions that are still
   * present in the federal data.
   * 4. Update modified date for the active restrictions. The time between creation
   * date and modified date can provide for how long that restriction is active.
   * @returns inserted records ids into student restrictions.
   */
  async executeBulkStepsChanges(manager: EntityManager): Promise<number[]> {
    // STEP 1
    // ! This bulk update MUST happen before the next operations to assign
    // ! the student foreign keys correctly.
    await this.bulkUpdateStudentsForeignKey(manager);
    // This bulk updates expects that the student foreign key is updated.
    // STEP 2
    const insertedRestrictionsIDs = await this.bulkInsertNewRestrictions(
      manager,
    );
    // STEP 3
    await this.bulkDeactivateRestrictions(manager);
    // This last update is not critical but allows the system to keep track
    // of the last time that an active restriction was received.
    // STEP 4
    await this.bulkUpdateActiveRestrictions(manager);

    return insertedRestrictionsIDs;
  }

  /*
   * After all the federal restrictions are imported, this update
   * associates all the students ids that matches with the students
   * currently on the database. This will be used for all subsequent
   * bulk operations to update the data on the table sims.student_restrictions.
   */
  private async bulkUpdateStudentsForeignKey(
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(this.bulkUpdateStudentIdSQL);
  }

  /*
   * Inserts into sims.student_restrictions all the federal restrictions
   * that are not present and active in the table. The same federal restriction
   * can be activated and deactivated multiple times for the same student,
   * generating a new record for every time that the restriction changes its state.
   * @returns inserted records ids.
   */
  private async bulkInsertNewRestrictions(
    manager: EntityManager,
  ): Promise<number[]> {
    const insertedRestrictions: { id: number }[] = await manager.query(
      this.bulkInsertNewRestrictionsSQL,
    );
    return insertedRestrictions.map((restriction) => restriction.id);
  }

  /*
   * Check all currently active federal restrictions present
   * on the table sims.student_restrictions to verify if they
   * are still present on the sims.federal_restrictions table.
   * If they are no longer present, they must be deactivated.
   */
  private async bulkDeactivateRestrictions(
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(this.bulkDeactivateRestrictionsSQL);
  }

  /*
   * Update all active federal restrictions on table sims.student_restrictions
   * that are still present of federal restrictions. This update is not
   * critical but it will keep the created date and updated date representing
   * in a more accurate way when the system received the restriction for the first
   * time till when the same status was kept in the federal snapshot day after day.
   */
  private async bulkUpdateActiveRestrictions(
    manager: EntityManager,
  ): Promise<void> {
    await manager.query(this.bulkUpdateActiveRestrictionsSQL);
  }
}
