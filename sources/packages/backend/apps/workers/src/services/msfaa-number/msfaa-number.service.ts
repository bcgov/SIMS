import { Injectable } from "@nestjs/common";
import { Brackets, DataSource } from "typeorm";
import {
  RecordDataModelService,
  MSFAANumber,
  OfferingIntensity,
} from "@sims/sims-db";
import * as dayjs from "dayjs";
import { MAX_MSFAA_VALID_DAYS } from "@sims/utilities";

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberService extends RecordDataModelService<MSFAANumber> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(MSFAANumber));
  }

  /**
   * Creates a new MSFAA number from the MSFAA number given
   * for the particular offering intensity.
   * @param msfaaNumber MSFAA number.
   * @returns created MSFAA record.
   */
  async createMSFAA(msfaaNumber: MSFAANumber): Promise<MSFAANumber> {
    return this.repo.save(msfaaNumber);
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
   * @param offeringIntensity MSFAA are generated individually for full-time/part-time
   * disbursements. The offering intensity is used to differentiate between them.
   * @param isSigned MSFAA number is signed or not.
   * @returns current valid MSFAA record.
   */
  async getCurrentValidMSFAANumber(
    studentId: number,
    offeringIntensity: OfferingIntensity,
    options?: { isSigned?: boolean },
  ): Promise<MSFAANumber> {
    const minimumValidDate = dayjs()
      .subtract(MAX_MSFAA_VALID_DAYS, "days")
      .toDate();
    const query = this.repo
      .createQueryBuilder("msfaaNumber")
      .innerJoin("msfaaNumber.student", "students")
      .where("students.id = :studentId", { studentId })
      .andWhere("msfaaNumber.referenceApplication is not null")
      .andWhere("msfaaNumber.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere("msfaaNumber.cancelledDate is null");
    if (options?.isSigned) {
      return query.andWhere("msfaaNumber.dateSigned is not null").getOne();
    } else
      return query
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
   * @param startDate start date. The start date would be the
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
      dayjs(endDate).diff(startDate, "days") < MAX_MSFAA_VALID_DAYS
    );
  }
}
