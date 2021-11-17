import { Injectable } from "@nestjs/common";
import { CustomNamedError } from "../../utilities";
import { Connection, Repository } from "typeorm";
import {
  APPLICATION_NOT_FOUND,
  APPLICATION_NOT_VALID,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  SequenceControlService,
} from "..";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  ApplicationStatus,
  DisbursementSchedule,
  DisbursementValue,
} from "../../database/entities";
import { Disbursement } from "./disbursement-schedule.models";

const DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP =
  "DISBURSEMENT_DOCUMENT_NUMBER";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly applicationRepo: Repository<Application>;
  constructor(
    connection: Connection,
    private readonly sequenceService: SequenceControlService,
  ) {
    super(connection.getRepository(DisbursementSchedule));
    this.applicationRepo = connection.getRepository(Application);
  }

  /**
   * Create the disbursements while the application is 'In Progress'.
   * Ensures that the application do not have any disbursements records
   * and creates the disbursements and values altogether.
   * ! This methods should be called for the first time when the
   * ! disbursements are being added to the Student Application.
   * ! Once the Student Application already has disbursements, another
   * ! scenarios must be considered, for instance, if some amount of money
   * ! was already released to the student.
   * @param applicationId application id to associate the disbursements.
   * @param disbursements array of disbursements and values to be created.
   * @returns created disbursements.
   */
  async createDisbursementSchedules(
    applicationId: number,
    disbursements: Disbursement[],
  ): Promise<DisbursementSchedule[]> {
    const application = await this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationStatus",
        "disbursementSchedules.id",
      ])
      .leftJoin("application.disbursementSchedules", "disbursementSchedules")
      .where("application.id = :applicationId", { applicationId })
      .getOne();

    if (!application) {
      throw new CustomNamedError(
        "Student Application not found.",
        APPLICATION_NOT_FOUND,
      );
    }

    if (application.applicationStatus !== ApplicationStatus.inProgress) {
      throw new CustomNamedError(
        `Student Application is not in the expected status. The application must be in application status '${ApplicationStatus.inProgress}' to disbursements be created.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    if (application.disbursementSchedules?.length > 0) {
      throw new CustomNamedError(
        `Disbursements were already created for this Student Application.`,
        APPLICATION_NOT_VALID,
      );
    }

    for (const disbursement of disbursements) {
      const newDisbursement = new DisbursementSchedule();
      newDisbursement.disbursementDate = disbursement.disbursementDate;
      newDisbursement.negotiatedExpiryDate = disbursement.negotiatedExpiryDate;
      newDisbursement.documentNumber = await this.getNextDocumentNumber();
      newDisbursement.disbursementValues = disbursement.disbursements.map(
        (disbursementValue) => {
          const newValue = new DisbursementValue();
          newValue.valueType = disbursementValue.valueType;
          newValue.valueCode = disbursementValue.valueCode;
          newValue.valueAmount = disbursementValue.valueAmount;
          return newValue;
        },
      );
      application.disbursementSchedules.push(newDisbursement);
    }

    await this.applicationRepo.save(application);
    return application.disbursementSchedules;
  }

  /**
   * Generates the next document number to be associated
   * with a disbursement.
   */
  private async getNextDocumentNumber(): Promise<number> {
    let nextDocumentNumber: number;
    await this.sequenceService.consumeNextSequence(
      DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP,
      async (nextSequenceNumber) => {
        nextDocumentNumber = nextSequenceNumber;
      },
    );
    return nextDocumentNumber;
  }

  async getECertInformation(): Promise<DisbursementSchedule[]> {
    return this.repo
      .createQueryBuilder("disbursement")
      .where("disbursement.date_sent is null")
      .getMany();
  }
}
