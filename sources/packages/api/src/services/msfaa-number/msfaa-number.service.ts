import { Injectable, Inject } from "@nestjs/common";
import {
  Brackets,
  Connection,
  In,
  IsNull,
  Repository,
  UpdateResult,
} from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  MSFAANumber,
  Student,
  Application,
  OfferingIntensity,
} from "../../database/entities";
import * as dayjs from "dayjs";
import { MAX_MFSAA_VALID_DAYS } from "../../utilities";
import { SequenceControlService } from "../sequence-control/sequence-control.service";

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberService extends RecordDataModelService<MSFAANumber> {
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly sequenceService: SequenceControlService,
  ) {
    super(connection.getRepository(MSFAANumber));
  }

  /**
   * Creates a new MSFAA record with a new number for the specified student.
   * @param studentId student to have a new MSFAA record created.
   * @returns Created MSFAA record.
   */
  async createMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<MSFAANumber> {
    const newMSFAANumber = new MSFAANumber();
    newMSFAANumber.msfaaNumber = await this.consumeNextSequence(
      offeringIntensity,
    );
    newMSFAANumber.student = { id: studentId } as Student;
    newMSFAANumber.referenceApplication = {
      id: referenceApplicationId,
    } as Application;
    return this.repo.save(newMSFAANumber);
  }

  /**
   * Generates the next number for an MSFAA.
   * @returns number to be used for the next MSFAA.
   */
  private async consumeNextSequence(
    offeringIntensity: OfferingIntensity,
  ): Promise<string> {
    let nextNumber: number;
    await this.sequenceService.consumeNextSequence(
      offeringIntensity + "_MSFAA_STUDENT_NUMBER",
      async (nextSequenceNumber: number) => {
        nextNumber = nextSequenceNumber;
      },
    );
    return nextNumber.toString();
  }

  /**
   * Gets an MSFAA record that should be considered as valid.
   * The record could be either in 'pending' state, when there is no signed
   * date, or could have a signed date still under the valid period for an MSFAA.
   * If there is one in 'pending' state (waiting for student signature),
   * the student must finishes it.
   * As per the current assumption, once the MSFAA is created on
   * ESDC it will not expire and can be reused.
   * @param studentId student id to filter.
   * @returns current valid MSFAA record.
   */
  async getCurrentValidMSFAANumber(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<MSFAANumber> {
    const minimumValidDate = dayjs()
      .subtract(MAX_MFSAA_VALID_DAYS, "days")
      .toDate();
    return this.repo
      .createQueryBuilder("msfaaNumber")
      .innerJoin("msfaaNumber.student", "students")
      .where("students.id = :studentId", { studentId })
      .andWhere("msfaaNumber.referenceApplication is not null")
      .andWhere("msfaaNumber.offeringIntensity= :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("msfaaNumber.dateSigned is null");
          qb.orWhere("msfaaNumber.dateSigned > :minimumValidDate", {
            minimumValidDate,
          });
        }),
      )
      .getOne();
  }

  /**
   * Determines whether MSFAA number is still valid.
   * @param [startDate] start date. The start date would be the
   * offering end date of a previously completed Student Application that,
   * in many scenarios, could not exist. Is this case, if the start date is
   * missing we will assume that there in no current valid MSFAA.
   * @param endDate end date.
   * @returns true if the provided dates shows that the MSFAA is
   * still valid, otherwise, false.
   */
  isMSFAANumberValid(startDate?: Date, endDate?: Date): boolean {
    return (
      !!startDate &&
      !!endDate &&
      dayjs(endDate).diff(startDate, "days") < MAX_MFSAA_VALID_DAYS
    );
  }

  /**
   * Fetches the MSFAA number records which are not sent for request.
   * This can be retrived by checking for date_requested column as null
   * in the MSFAANumber table.
   * @returns the records of the MSFAANumber table.
   */
  async getPendingMSFAARequest(
    offeringIntensity: OfferingIntensity,
  ): Promise<MSFAANumber[]> {
    return this.repo
      .createQueryBuilder("msfaaNumber")
      .select([
        "msfaaNumber.id",
        "students.id",
        "referenceApplication.id",
        "msfaaNumber.msfaaNumber",
        "students.sin",
        "institutionLocation.institutionCode",
        "students.birthDate",
        //"students.maritalStatus",
        "users.lastName",
        "users.firstName",
        "students.gender",
        "students.contactInfo",
        "users.email",
        "offering.offeringIntensity",
      ])
      .innerJoin("msfaaNumber.student", "students")
      .innerJoin("students.user", "users")
      .innerJoin("msfaaNumber.referenceApplication", "referenceApplication")
      .innerJoin("referenceApplication.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .where("msfaaNumber.dateRequested is null")
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .getMany();
  }

  /**
   * Once the MSFAA request file is created, updates the
   * date that the file was uploaded.
   * @param msfaaRequestIds records that are part of the generated
   * file that must have the file sent name and date updated.
   * @param dateSent date that the file was uploaded.
   * @param [externalRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateRecordsInSentFile(
    msfaaRequestIds: number[],
    dateRequested: Date,
    externalRepo?: Repository<MSFAANumber>,
  ) {
    if (!dateRequested) {
      throw new Error(
        "Date sent field is not provided to update the MSFAA records.",
      );
    }
    const repository = externalRepo ?? this.repo;
    return repository.update({ id: In(msfaaRequestIds) }, { dateRequested });
  }

  /**
   * Once the MSFAA response file is processed, updates the
   * MSFAA received on the database with the
   * information received. If the information was already received
   * the record will not be updated.
   * @param msfaaNumber MSFAA number
   * @param dateSigned date in which the borrower indicated the MSFAA was signed
   * @param serviceProviderReceivedDate date in which the MSDAA was received by/resolve from CanadaPost/Kiosk
   * @returns update result. Only one row is supposed to be affected.
   */
  async updateReceivedFile(
    msfaaNumber: string,
    dateSigned: Date,
    serviceProviderReceivedDate: Date,
  ): Promise<UpdateResult> {
    if (!dateSigned || !serviceProviderReceivedDate) {
      throw new Error(
        "Not all required fields to update a received MSFAA record were provided.",
      );
    }

    return this.repo.update(
      {
        msfaaNumber: msfaaNumber,
        dateSigned: IsNull(),
        serviceProviderReceivedDate: IsNull(),
      },
      {
        dateSigned,
        serviceProviderReceivedDate,
      },
    );
  }

  /**
   * Once the MSFAA response file is processed, updates the
   * MSFAA received cancelled records on the database with the
   * information received. If the information was already received
   * the record will not be updated.
   * @param msfaaNumber MSFAA number
   * @param cancelledDate date when the MSFAA was cancelled.
   * @param newIssusingProvince New province which is issuing the MSFAA.
   * @returns update result. Only one row is supposed to be affected.
   */
  async updateCancelledReceivedFile(
    msfaaNumber: string,
    cancelledDate: Date,
    newIssuingProvince: string,
  ): Promise<UpdateResult> {
    if (!cancelledDate || !newIssuingProvince) {
      throw new Error(
        "Not all required fields to update a received MSFAA record were provided.",
      );
    }

    return this.repo.update(
      {
        msfaaNumber: msfaaNumber,
        cancelledDate: IsNull(),
        newIssuingProvince: IsNull(),
      },
      {
        cancelledDate,
        newIssuingProvince,
      },
    );
  }
}
