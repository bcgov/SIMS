import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MSFAANumber } from "@sims/sims-db";
import { Repository } from "typeorm";

/**
 * Service for MSFAA (Master Student Financial Aid Agreement)
 * number activity associated with a student.
 */
@Injectable()
export class MSFAANumberService {
  constructor(
    @InjectRepository(MSFAANumber)
    private readonly msfaaNumberRepo: Repository<MSFAANumber>,
  ) {}

  /**
   * Gets all MSFAA numbers associated with a student ordered by creation date newest to oldest.
   * @param studentId student id to filter the MSFAA records.
   * @returns list of MSFAA number records for the student.
   */
  async getStudentMSFAAActivity(studentId: number): Promise<MSFAANumber[]> {
    return this.msfaaNumberRepo.find({
      select: {
        id: true,
        createdAt: true,
        offeringIntensity: true,
        msfaaNumber: true,
        dateRequested: true,
        dateSigned: true,
        cancelledDate: true,
        newIssuingProvince: true,
      },
      where: { student: { id: studentId } },
      order: { createdAt: "DESC" },
    });
  }
}
