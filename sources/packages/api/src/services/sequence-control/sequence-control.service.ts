import { Inject, Injectable } from "@nestjs/common";
import { configureIdleTransactionSessionSimeout } from "../../utilities/database";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { SequenceControl } from "../../database/entities";

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
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(SequenceControl));
  }

  /**
   * Allows that a new sequence number, controlled by the database, be acquired.
   * Between the process of getting the next sequence number and updating it back
   * to the database, a process can be executed in the middle, making it possible that
   * the number on database only be incremented if the process in the middle
   * was successfully  executed.
   * @param sequenceName
   * @param process
   */
  public async consumeNextSequence(
    sequenceName: string,
    process: (sequenceNumber: number) => Promise<void>,
  ) {
    const queryRunner = this.connection.createQueryRunner();
    configureIdleTransactionSessionSimeout(
      queryRunner,
      TRANSACTION_IDLE_TIMEOUT_SECONDS,
    );
    try {
      await queryRunner.startTransaction();
      // Select and lock the specific record only.
      // If another attempt of generating the next sequence number
      // happens in the same sequence name the second request will
      // wait until the first one finishes, what will ensure that
      // two concurrent processes will not be generating a new
      // sequence number at the same time.
      let sequenceRecord = await queryRunner.manager
        .getRepository(SequenceControl)
        .createQueryBuilder("sc")
        .setLock("pessimistic_write")
        .where("sc.sequenceName = :sequenceName", { sequenceName })
        .getOne();

      // If there is no record for the sequence name, create one.
      if (!sequenceRecord) {
        sequenceRecord = new SequenceControl();
        sequenceRecord.sequenceName = sequenceName;
        sequenceRecord.sequenceNumber = 0;
      }

      // At this moment it is safe to increment the number because
      // the record with the corresponding sequence name is locked.
      const nextSequenceNumber = sequenceRecord.sequenceNumber + 1;
      // Waits for the external process be executed.
      await process(nextSequenceNumber);
      // If the external process was successfully execute
      // update the new sequence number to the database.
      sequenceRecord.sequenceNumber = nextSequenceNumber;
      queryRunner.manager.save(sequenceRecord);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
}
