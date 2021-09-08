import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { ApplicationService, SequenceControlService } from "..";
import { RecordDataModelService } from "../../database/data.model.service";
import { MSFAANumber, Student } from "../../database/entities";
import * as dayjs from "dayjs";

const MAX_MFSAA_VALID_DAYS = 730;

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberService extends RecordDataModelService<MSFAANumber> {
  constructor(
    @Inject("Connection") connection: Connection,
    private readonly applicationService: ApplicationService,
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
    // TODO: 1 - Offering END DATE of the last completed application with a MSFAA Signed DATE
    // TODO: 2 - If there is an record with signed data NULL we can use it
    const newMSFAANumber = new MSFAANumber();
    newMSFAANumber.msfaaNumber = await this.consumeNextSequence();
    newMSFAANumber.student = { id: studentId } as Student;
    return this.repo.save(newMSFAANumber);
  }

  async getPendingToSignMSFAANumber(studentId: number): Promise<MSFAANumber> {
    return this.repo.findOne({ student: { id: studentId }, dateSigned: null });
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

  isValidMSFAANumberValid(
    applicationStartDate: Date,
    lastSignedMSFAA?: Date,
  ): boolean {
    return (
      lastSignedMSFAA &&
      dayjs(applicationStartDate).diff(lastSignedMSFAA, "days") <
        MAX_MFSAA_VALID_DAYS
    );
  }
}
