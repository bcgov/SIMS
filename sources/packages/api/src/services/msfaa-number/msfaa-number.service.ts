import { Injectable, Inject } from "@nestjs/common";
import { Connection } from "typeorm";
import { ApplicationService, SequenceControlService } from "..";
import { RecordDataModelService } from "../../database/data.model.service";
import { MSFAANumber, Student } from "../../database/entities";

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
   * Creates a new MSFAA record with a new number
   * for the specified student.
   * @param studentId student to have a new MSFAA record created.
   * @returns Created MSFAA record number.
   */
  async createMSFAANumber(studentId: number): Promise<MSFAANumber> {
    // TODO: Offering END DATE of the last completed application with a MSFAA Signed DATE
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
}
