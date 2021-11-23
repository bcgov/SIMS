import { Injectable } from "@nestjs/common";
import {
  CustomNamedError,
  DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
} from "../../utilities";
import { Connection, In, Repository } from "typeorm";
import {
  APPLICATION_NOT_FOUND,
  APPLICATION_NOT_VALID,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
  SequenceControlService,
  StudentRestrictionService,
} from "..";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  ApplicationStatus,
  DisbursementSchedule,
  DisbursementValue,
  OfferingIntensity,
} from "../../database/entities";
import { Disbursement } from "./disbursement-schedule.models";
import * as dayjs from "dayjs";

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
    private readonly studentRestrictionService: StudentRestrictionService,
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
          newValue.valueAmount = disbursementValue.valueAmount.toString();
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

  /**
   * Get all records that must be part of the e-Cert files and that were not sent yet.
   * Considerer any record that is scheduled in upcoming days or in the past.
   * Check if the student has a valid SIN.
   * Consider only completed Student Applications with signed MSFAA date.
   * Check if there are restrictions applied to the student account that would
   * prevent the disbursement.
   */
  async getECertInformationToBeSent(
    offeringIntensity: OfferingIntensity,
  ): Promise<DisbursementSchedule[]> {
    // Define the minimum date to send a disbursement.
    const disbursementMinDate = dayjs()
      .add(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS, "days")
      .toDate();

    return this.repo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.documentNumber",
        "disbursement.negotiatedExpiryDate",
        "disbursement.disbursementDate",
        "application.applicationNumber",
        "application.data",
        "application.assessment",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.tuitionRemittanceRequestedAmount",
        "offering.yearOfStudy",
        "educationProgram.cipCode",
        "educationProgram.completionYears",
        "user.firstName",
        "user.lastName",
        "user.email",
        "student.sin",
        "student.birthDate",
        "student.gender",
        "student.contactInfo",
        "location.id",
        "location.institutionCode",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
      ])
      .innerJoin("disbursement.application", "application")
      .innerJoin("application.location", "location")
      .innerJoin("application.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student") // ! The student alias here is also used in sub query 'getExistsBlockRestrictionQuery'.
      .innerJoin("student.user", "user")
      .innerJoin("application.msfaaNumber", "msfaaNumber")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .where("disbursement.dateSent is null")
      .andWhere("disbursement.disbursementDate <= :disbursementMinDate", {
        disbursementMinDate,
      })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.completed,
      })
      .andWhere("msfaaNumber.dateSigned is not null")
      .andWhere("student.validSIN = true")
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        `NOT EXISTS(${this.studentRestrictionService
          .getExistsBlockRestrictionQuery()
          .getSql()})`,
      )
      .getMany();
  }

  /**
   * Once the e-Cert file is sent, updates the date that the file was uploaded.
   * @param disbursementIds records that are part of the generated
   * file that must have the date sent updated.
   * @param dateSent date that the file was uploaded.
   * @param [disbursementScheduleRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateRecordsInSentFile(
    disbursementIds: number[],
    dateSent: Date,
    disbursementScheduleRepo?: Repository<DisbursementSchedule>,
  ) {
    if (!dateSent) {
      throw new Error(
        "Date sent field is not provided to update the disbursement records.",
      );
    }
    const repository = disbursementScheduleRepo ?? this.repo;
    return repository.update({ id: In(disbursementIds) }, { dateSent });
  }
}
