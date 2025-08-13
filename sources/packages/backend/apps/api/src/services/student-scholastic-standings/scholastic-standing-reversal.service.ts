import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  AssessmentTriggerType,
  OfferingStatus,
  StudentScholasticStanding,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import {
  SCHOLASTIC_STANDING_NOT_FOUND,
  SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED,
} from "apps/api/src/constants";
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
    return (
      this.scholasticStandingRepo
        .createQueryBuilder("scholasticStanding")
        .select([
          "scholasticStanding.id",
          "scholasticStanding.changeType",
          "scholasticStanding.reversalDate",
          "application.id",
          "currentAssessment.id",
          "currentAssessment.triggerType",
          "studentAppeal.id",
          "offeringBeforeScholasticStanding.id",
          "parentOffering.id",
          "offeringVersion.id",
        ])
        .innerJoin("scholasticStanding.application", "application")
        .innerJoin("application.currentAssessment", "currentAssessment")
        .leftJoin("currentAssessment.studentAppeal", "studentAppeal")
        .innerJoin(
          "scholasticStanding.referenceOffering",
          "offeringBeforeScholasticStanding",
        )
        .innerJoin(
          "offeringBeforeScholasticStanding.parentOffering",
          "parentOffering",
        )
        // Current version of the offering that was associated with the application before the scholastic standing was reported.
        .innerJoin(
          "parentOffering.versions",
          "offeringVersion",
          "offeringVersion.offeringStatus IN (:...currentOfferingStatuses)",
          {
            currentOfferingStatuses: [
              OfferingStatus.Approved,
              OfferingStatus.ChangeUnderReview,
            ],
          },
        )
        .where("scholasticStanding.id = :scholasticStandingId", {
          scholasticStandingId,
        })
        .getOne()
    );
  }
  async reverseScholasticStanding(
    scholasticStandingId: number,
    reversalNote: string,
    auditUserId: number,
  ): Promise<void> {
    const scholasticStanding = await this.getScholasticStanding(
      scholasticStandingId,
    );
    if (!scholasticStanding) {
      throw new CustomNamedError(
        `Scholastic standing ${scholasticStandingId} not found.`,
        SCHOLASTIC_STANDING_NOT_FOUND,
      );
    }
    if (scholasticStanding.reversalDate) {
      throw new CustomNamedError(
        `Scholastic standing ${scholasticStandingId} is already reversed.`,
        SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED,
      );
    }
    const currentAssessment = scholasticStanding.application.currentAssessment;
    // All the scholastic standing change types except 'Student did not complete program'
    // creates a re-assessment with updated study period end date.
    // Hence to reverse those scholastic standings a re-assessment is required to reverse the study period changes.
    const isReAssessmentRequired =
      scholasticStanding.changeType !==
      StudentScholasticStandingChangeType.StudentDidNotCompleteProgram;
    if (
      isReAssessmentRequired &&
      currentAssessment.triggerType ===
        AssessmentTriggerType.ScholasticStandingChange
    ) {
      throw new CustomNamedError(
        `Scholastic standing reversal is not allowed for change type ${scholasticStanding.changeType} as the current assessment trigger type is not ${AssessmentTriggerType.ScholasticStandingChange} but ${currentAssessment.triggerType}.`,
        SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED,
      );
    }
  }
}
