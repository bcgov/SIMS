import { Injectable, Logger } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  RecordDataModelService,
  SequenceControl,
  configureIdleTransactionSessionTimeout,
} from "@sims/sims-db";

// Timeout to handle the worst-case scenario where the commit/rollback
// was not executed due to a possible catastrophic failure.
const TRANSACTION_IDLE_TIMEOUT_SECONDS = 30;

/**
 * Manages sequence numbers that are out of controls of the solution.
 * For instance, for integrations like CRA and ESDC, the files must have
 * a mandatory sequence that will be validate by the third-party server
 * receiving this files. After a number is generated and the file is sent,
 * there is no current method that allow us to know if this file was rejected
 * and in some cases this number need be manually adjusted.
 */
@Injectable()
export class SequenceControlService extends RecordDataModelService<SequenceControl> {
  private readonly logger = new Logger(SequenceControlService.name);

  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(SequenceControl));
  }

  /**
   * Allows that a new sequence number, controlled by the database, be acquired.
   * Between the process of getting the next sequence number and updating it back
   * to the database, a process can be executed in the middle, making it possible that
   * the number on database only be incremented if the process in the middle
   * was successfully  executed.
   * @param sequenceName name of the sequence to be incremented.
   * @param process process to be executed. Depending on the process
   * to be executed, in case of an error happen, the sequence could not be
   * consumed in case of failure.
   */
  public async consumeNextSequence(
    sequenceName: string,
    process: (
      sequenceNumber: number,
      entityManager: EntityManager,
    ) => Promise<void>,
  ) {
    this.logger.log(
      `Checking next sequence available for sequence name ${sequenceName}...`,
    );
    const queryRunner = this.dataSource.createQueryRunner();
    await configureIdleTransactionSessionTimeout(
      queryRunner,
      TRANSACTION_IDLE_TIMEOUT_SECONDS,
    );
    try {
      await queryRunner.startTransaction();
      await this.consumeNextSequenceWithExistingEntityManager(
        sequenceName,
        queryRunner.manager,
        process,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.error("Executing sequence number rollback...");
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Allows that a new sequence number, controlled by the database, be acquired.
   * Between the process of getting the next sequence number and updating it back
   * to the database, a process can be executed in the middle, making it possible that
   * the number on database only be incremented if the process in the middle
   * was successfully  executed.
   * @param sequenceName name of the sequence to be incremented.
   * @param process process to be executed. Depending on the process
   * to be executed, in case of an error happen, the sequence could not be
   * consumed in case of failure.
   * @param entityManager existing entity manager, to use the transaction from the
   * called method.
   */
  public async consumeNextSequenceWithExistingEntityManager(
    sequenceName: string,
    entityManager: EntityManager,
    process: (
      sequenceNumber: number,
      entityManager: EntityManager,
    ) => Promise<void>,
  ) {
    try {
      // Select and lock the specific record only.
      // If another attempt of generating the next sequence number
      // happens in the same sequence name the second request will
      // wait until the first one finishes, what will ensure that
      // two concurrent processes will not be generating a new
      // sequence number at the same time.
      this.logger.log("Getting current sequence from DB...");
      let sequenceRecord = await entityManager
        .getRepository(SequenceControl)
        .createQueryBuilder("sc")
        .setLock("pessimistic_write")
        .where("sc.sequenceName = :sequenceName", { sequenceName })
        .getOne();

      // If there is no record for the sequence name, create one.
      if (!sequenceRecord) {
        sequenceRecord = new SequenceControl();
        sequenceRecord.sequenceName = sequenceName;
        sequenceRecord.sequenceNumber = "0";
      }

      // At this moment it is safe to increment the number because
      // the record with the corresponding sequence name is locked.
      // Note that the sequenceRecord.sequenceNumber is a string due to the
      // Typeorm/javascript way to map a bigint. So, the value must be converted
      // to a number before it is incremented.
      const nextSequenceNumber = +sequenceRecord.sequenceNumber + 1;
      // Waits for the external process be executed.
      this.logger.log(
        `Executing process using sequence number ${nextSequenceNumber}`,
      );
      // Even the sequence number being represented as a bigint in Postgres here
      // we are assuming that the max value will not go beyond the number safe limit.
      await process(nextSequenceNumber, entityManager);
      // If the external process was successfully execute
      // update the new sequence number to the database.
      sequenceRecord.sequenceNumber = nextSequenceNumber.toString();
      this.logger.log("Persisting new sequence number to database...");
      await entityManager.save(sequenceRecord);
    } catch (error) {
      this.logger.error(
        "Error while executing in the consumeNextSequenceWithExistingEntityManager method",
      );
      throw error;
    }
  }
}
