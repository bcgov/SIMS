import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { MSFAANumber, Student } from "../../database/entities";
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
  async createMSFAANumber(studentId: number): Promise<MSFAANumber> {
    const newMSFAANumber = new MSFAANumber();
    newMSFAANumber.msfaaNumber = await this.consumeNextSequence();
    newMSFAANumber.student = { id: studentId } as Student;
    return this.repo.save(newMSFAANumber);
  }

  /**
   * Generates the next number for a MSFAA.
   * @returns number to be used for the next MSFAA.
   */
  private async consumeNextSequence(): Promise<number> {
    let nextNumber: number;
    await this.sequenceService.consumeNextSequence(
      "MSFAA_STUDENT_NUMBER",
      async (nextSequenceNumber: number) => {
        nextNumber = nextSequenceNumber;
      },
    );
    return nextNumber;
  }

  /**
   * Gets a MSFAA record that was never signed.
   * @param studentId student id to filter.
   * @returns not signed MSFAA if exists, otherwise, null.
   */
  async getPendingToSignMSFAANumber(studentId: number): Promise<MSFAANumber> {
    return this.repo.findOne({ student: { id: studentId }, dateSigned: null });
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
  isMSFAANumberValid(startDate: Date = null, endDate: Date): boolean {
    return (
      !!startDate &&
      dayjs(endDate).diff(startDate, "days") < MAX_MFSAA_VALID_DAYS
    );
  }
}
