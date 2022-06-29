import { Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  DisbursementReceipt,
  DisbursementReceiptValue,
  DisbursementSchedule,
  User,
} from "../../database/entities";
import { DisbursementReceiptModel } from "./disbursement-receipt.model";

/**
 * Service for disbursement receipts.
 */
@Injectable()
export class DisbursementReceiptService extends RecordDataModelService<DisbursementReceipt> {
  constructor(private readonly connection: Connection) {
    super(connection.getRepository(DisbursementReceipt));
  }

  /**
   * Insert disbursement receipt record.
   ** On insertion ignore duplicate records(identified by constraint disbursement_schedule_id_funding_type_unique).
   * @param disbursementReceipt
   * @param batchRunDate batch run date of the disbursement file.
   * @param disbursementScheduleId disbursement schedule id of corresponding document number.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param createdAt supplied from consumer as to keep the value consistent.
   * @returns generated identifier if the disbursement receipt is inserted successfully.
   */
  async insertDisbursementReceipt(
    disbursementReceipt: DisbursementReceiptModel,
    batchRunDate: Date,
    disbursementScheduleId: number,
    auditUserId: number,
    createdAt: Date,
  ): Promise<number> {
    let generatedId: number;
    const creator = { id: auditUserId } as User;
    const disbursementReceiptEntity = new DisbursementReceipt();
    disbursementReceiptEntity.batchRunDate = batchRunDate;
    disbursementReceiptEntity.studentSIN = disbursementReceipt.studentSIN;
    disbursementReceiptEntity.disbursementSchedule = {
      id: disbursementScheduleId,
    } as DisbursementSchedule;
    disbursementReceiptEntity.fundingType = disbursementReceipt.fundingType;
    disbursementReceiptEntity.totalEntitledDisbursedAmount =
      disbursementReceipt.totalEntitledDisbursedAmount;
    disbursementReceiptEntity.totalDisbursedAmount =
      disbursementReceipt.totalDisbursedAmount;
    disbursementReceiptEntity.disburseDate = disbursementReceipt.disburseDate;
    disbursementReceiptEntity.disburseAmountStudent =
      disbursementReceipt.disburseAmountStudent;
    disbursementReceiptEntity.disburseAmountInstitution =
      disbursementReceipt.disburseAmountInstitution;
    disbursementReceiptEntity.dateSignedInstitution =
      disbursementReceipt.dateSignedInstitution;
    disbursementReceiptEntity.institutionCode =
      disbursementReceipt.institutionCode;
    disbursementReceiptEntity.disburseMethodStudent =
      disbursementReceipt.disburseMethodStudent;
    disbursementReceiptEntity.studyPeriodEndDate =
      disbursementReceipt.studyPeriodEndDate;
    disbursementReceiptEntity.totalEntitledGrantAmount =
      disbursementReceipt.totalEntitledGrantAmount;
    disbursementReceiptEntity.totalDisbursedGrantAmount =
      disbursementReceipt.totalDisbursedGrantAmount;
    disbursementReceiptEntity.totalDisbursedGrantAmountStudent =
      disbursementReceipt.totalDisbursedGrantAmountStudent;
    disbursementReceiptEntity.totalDisbursedGrantAmountInstitution =
      disbursementReceipt.totalDisbursedGrantAmountInstitution;
    disbursementReceiptEntity.creator = creator;
    disbursementReceiptEntity.createdAt = createdAt;
    disbursementReceiptEntity.disbursementReceiptValues =
      disbursementReceipt.grants.map((grant) => {
        const disbursementReceiptValue = new DisbursementReceiptValue();
        disbursementReceiptValue.grantType = grant.grantType;
        disbursementReceiptValue.grantAmount = grant.grantAmount;
        disbursementReceiptValue.creator = creator;
        disbursementReceiptValue.createdAt = createdAt;
        return disbursementReceiptValue;
      });
    await this.connection.transaction(async (transactionalEntityManager) => {
      //Query builder inserts does not cascade insert with relationships.
      //Cascaded insert can be achieved only through repository.save().
      //Hence inside a transaction we are using save to persist relations.

      const result = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(DisbursementReceipt)
        .values(disbursementReceiptEntity)
        .orIgnore(
          "ON CONSTRAINT disbursement_schedule_id_funding_type_unique DO NOTHING",
        )
        .execute();
      const [identifier] = result.identifiers;
      generatedId = identifier?.id;
      if (
        generatedId &&
        disbursementReceiptEntity.disbursementReceiptValues?.length > 0
      ) {
        await transactionalEntityManager
          .getRepository(DisbursementReceipt)
          .save({
            id: identifier.id,
            disbursementReceiptValues:
              disbursementReceiptEntity.disbursementReceiptValues,
          });
      }
    });
    return generatedId;
  }

  /**
   * Gets the latest batch run date in the disbursement receipt table.
   * @returns latest batch run date.
   */
  async getMaxDisbursementReceiptDate(): Promise<Date> {
    const batchRunDate = await this.repo
      .createQueryBuilder("disbursementReceipt")
      .select("MAX(disbursementReceipt.batchRunDate)")
      .getRawOne();
    return batchRunDate?.max ?? new Date();
  }
}
