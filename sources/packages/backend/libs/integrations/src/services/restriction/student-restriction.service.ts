import { Injectable } from "@nestjs/common";
import { RestrictionActionType, StudentRestriction } from "@sims/sims-db";
import { ArrayContains, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class StudentRestrictionService {
  constructor(
    @InjectRepository(StudentRestriction)
    private readonly studentRestrictionRepo: Repository<StudentRestriction>,
  ) {}

  /**
   * Todo: ann
   */
  async hasActiveStopFullTimeDisbursement(studentId: number): Promise<Boolean> {
    const activeRestrictions = await this.studentRestrictionRepo.find({
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
    });
    return activeRestrictions.length > 0 ? true : false;
  }
}
