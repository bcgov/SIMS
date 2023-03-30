import { Injectable } from "@nestjs/common";
import { Brackets, DataSource } from "typeorm";
import {
  RecordDataModelService,
  MSFAANumber,
  Student,
  Application,
  OfferingIntensity,
} from "@sims/sims-db";
import * as dayjs from "dayjs";
import { MAX_MSFAA_VALID_DAYS } from "@sims/utilities";
import { SequenceControlService } from "@sims/services";

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberService extends RecordDataModelService<MSFAANumber> {
  constructor(
    dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
  ) {
    super(dataSource.getRepository(MSFAANumber));
  }

  /**
   * Creates a new MSFAA record with a new number for the specified student.
   * @param studentId student to have a new MSFAA record created.
   * @param referenceApplicationId reference application id.
   * @param offeringIntensity offering intensity since the MSFAA are calculated
   * individually based on, for instance, the Part time/Full time.
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
    newMSFAANumber.offeringIntensity = offeringIntensity;
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
   * @param offeringIntensity MSFAA are generated individually for full-time/part-time
   * disbursements. The offering intensity is used to differentiate between them.
   * @returns current valid MSFAA record.
   */
  async getCurrentValidMSFAANumber(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<MSFAANumber> {
    const minimumValidDate = dayjs()
      .subtract(MAX_MSFAA_VALID_DAYS, "days")
      .toDate();
    return this.repo
      .createQueryBuilder("msfaaNumber")
      .innerJoin("msfaaNumber.student", "students")
      .where("students.id = :studentId", { studentId })
      .andWhere("msfaaNumber.referenceApplication is not null")
      .andWhere("msfaaNumber.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere("msfaaNumber.cancelledDate is null")
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
