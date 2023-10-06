import { Injectable } from "@nestjs/common";
import { RestrictionActionType, StudentRestriction } from "@sims/sims-db";
import { ArrayContains, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for student restriction.
 */
@Injectable()
export class StudentRestrictionService {
  constructor(
    @InjectRepository(StudentRestriction)
    private readonly studentRestrictionRepo: Repository<StudentRestriction>,
  ) {}

  /**
   * Checks if there is any active stop full time disbursement restriction
   * for a student.
   * @param studentId student id.
   * @returns true if there is any active stop full time disbursement
   * restriction for a student.
   */
  async hasActiveStopFullTimeDisbursement(studentId: number): Promise<boolean> {
    return !!(await this.studentRestrictionRepo.findOne({
      select: {
        id: true,
      },
      where: {
        isActive: true,
        student: {
          id: studentId,
        },
        restriction: {
          actionType: ArrayContains([
            RestrictionActionType.StopFullTimeDisbursement,
          ]),
        },
      },
    }));
  }
}
