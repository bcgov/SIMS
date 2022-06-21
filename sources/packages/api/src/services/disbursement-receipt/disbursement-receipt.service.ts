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
   */
  async insertDisbursementReceipt(
    disbursementReceipt: DisbursementReceiptModel,
    batchRunDate: Date,
    disbursementScheduleId: number,
    auditUserId: number,
    createdAt: Date,
  ): Promise<void> {
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
      if (
        identifier &&
        disbursementReceiptEntity.disbursementReceiptValues?.length > 0
      ) {
        await transactionalEntityManager
          .getRepository(DisbursementReceipt)
          .save({
            id: result.identifiers[0].id,
            disbursementReceiptValues:
              disbursementReceiptEntity.disbursementReceiptValues,
          });
      }
    });
  }
}
