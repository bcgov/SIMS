import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentScholasticStanding } from "@sims/sims-db";
import { Repository } from "typeorm";
/**
 * Service to handle scholastic standing reversal operations.
 */
@Injectable()
export class ScholasticStandingReversalService {
  constructor(
    @InjectRepository(StudentScholasticStanding)
    private readonly scholasticStandingRepo: Repository<StudentScholasticStanding>,
  ) {}

  /**
   * Get scholastic standing details.
   * @param scholasticStandingId scholastic standing id.
   * @returns scholastic standing details.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
  ): Promise<StudentScholasticStanding> {
    return this.scholasticStandingRepo.findOne({
      select: {
        id: true,
        changeType: true,
        reversalDate: true,
        application: {
          id: true,
          currentAssessment: { id: true, triggerType: true },
        },
      },
      relations: { application: { currentAssessment: true } },
      where: { id: scholasticStandingId },
    });
  }
}
