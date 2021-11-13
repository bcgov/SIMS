import { Injectable, Inject } from "@nestjs/common";
import { Connection, Repository } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  ApplicationStatus,
  DisbursementSchedule,
  DisbursementValue,
} from "../../database/entities";
import { Disbursement } from "./disbursement-schedule.models";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly applicationRepo: Repository<Application>;
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(DisbursementSchedule));
    this.applicationRepo = connection.getRepository(Application);
  }

  async createDisbursementSchedules(
    applicationId: number,
    disbursements: Disbursement[],
  ): Promise<DisbursementSchedule[]> {
    // const application = await this.applicationRepo
    //   .createQueryBuilder("application")
    //   .select(["application.id"])
    //   .where("application.id = :applicationId", { applicationId })
    //   // .andWhere("application.applicationStatus = :applicationStatus", {
    //   //   applicationStatus: ApplicationStatus.inProgress,
    //   // })
    //   .getOne();

    // console.log(application);

    const disbursementSchedules = disbursements.map((disbursement) => {
      const newDisbursement = new DisbursementSchedule();
      newDisbursement.application = { id: applicationId } as Application;
      newDisbursement.disbursementDate = disbursement.disbursementDate;
      newDisbursement.documentDumber = 1;
      newDisbursement.disbursementValues = disbursement.disbursements.map(
        (disbursementValue) => {
          const newValue = new DisbursementValue();
          newValue.valueType = disbursementValue.valueType;
          newValue.valueCode = disbursementValue.valueCode;
          newValue.valueAmount = disbursementValue.valueAmount;
          return newValue;
        },
      );
      return newDisbursement;
    });

    return await this.repo.save(disbursementSchedules);
  }
}
