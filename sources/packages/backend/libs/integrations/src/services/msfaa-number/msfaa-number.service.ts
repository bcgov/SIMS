import { Injectable } from "@nestjs/common";
import { DataSource, In, IsNull, Repository, UpdateResult } from "typeorm";
import {
  RecordDataModelService,
  MSFAANumber,
  OfferingIntensity,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { MSFAANumberSharedService, SystemUsersService } from "@sims/services";

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberService extends RecordDataModelService<MSFAANumber> {
  constructor(
    dataSource: DataSource,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(dataSource.getRepository(MSFAANumber));
  }

  /**
   * Fetches the MSFAA number records which are not sent for request.
   * This can be retrieved by checking for date_requested column as null
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
        "sinValidation.id",
        "sinValidation.sin",
        "institutionLocation.institutionCode",
        "students.birthDate",
        "referenceApplication.relationshipStatus",
        "users.lastName",
        "users.firstName",
        "students.gender",
        "students.contactInfo",
        "users.email",
        "currentAssessment.id",
        "offering.offeringIntensity",
      ])
      .innerJoin("msfaaNumber.student", "students")
      .innerJoin("students.sinValidation", "sinValidation")
      .innerJoin("students.user", "users")
      .innerJoin("msfaaNumber.referenceApplication", "referenceApplication")
      .innerJoin("referenceApplication.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .where("msfaaNumber.dateRequested is null")
      .andWhere("msfaaNumber.cancelledDate is null")
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .orderBy("msfaaNumber.msfaaNumber")
      .getMany();
  }

  /**
   * Once the MSFAA request file is created, updates the
   * date that the file was uploaded.
   * @param msfaaRequestIds records that are part of the generated
   * file that must have the file sent name and date updated.
   * @param dateRequested date that the file was uploaded.
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
   * @param msfaaNumber MSFAA number.
   * @param dateSigned date in which the borrower indicated the MSFAA was signed.
   * @param serviceProviderReceivedDate date in which the MSFAA was received by/resolve from CanadaPost/Kiosk.
   * @returns update result. Only one row is supposed to be affected.
   */
  async updateReceivedRecord(
    msfaaNumber: string,
    dateSigned: Date,
    serviceProviderReceivedDate: Date,
  ): Promise<UpdateResult> {
    if (!dateSigned || !serviceProviderReceivedDate) {
      throw new Error(
        "Not all required fields to update a received MSFAA record were provided.",
      );
    }
    // Check if the msfaa number needs to be reactivated or simply updated with a signed date.
    const retrievedMSFAARecord = await this.repo.findOne({
      select: {
        id: true,
        studentId: true,
        referenceApplicationId: true,
        cancelledDate: true,
        dateSigned: true,
        offeringIntensity: true,
      },
      where: {
        msfaaNumber,
      },
    });
    if (
      !retrievedMSFAARecord.dateSigned &&
      retrievedMSFAARecord.cancelledDate
    ) {
      // This msfaa number was originally cancelled and is being reactivated now. Re-associate all disbursements pending e-cert generation for the same offering intensity with this msfaa number.
      await this.msfaaNumberSharedService.internalCreateMSFAANumber(
        retrievedMSFAARecord.studentId,
        retrievedMSFAARecord.referenceApplicationId,
        retrievedMSFAARecord.offeringIntensity,
        (
          await this.systemUsersService.systemUser()
        ).id,
        { msfaaNumber: { id: retrievedMSFAARecord.id } as MSFAANumber },
      );
    }
    return this.repo.update(
      {
        msfaaNumber,
        dateSigned: IsNull(),
        serviceProviderReceivedDate: IsNull(),
      },
      {
        dateSigned: getISODateOnlyString(dateSigned),
        serviceProviderReceivedDate: getISODateOnlyString(
          serviceProviderReceivedDate,
        ),
        cancelledDate: null,
        newIssuingProvince: null,
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
   * @param newIssuingProvince New province which is issuing the MSFAA.
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
        cancelledDate: getISODateOnlyString(cancelledDate),
        newIssuingProvince,
      },
    );
  }
}
