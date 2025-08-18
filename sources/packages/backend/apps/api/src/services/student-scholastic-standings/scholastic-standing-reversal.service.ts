import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NoteSharedService } from "@sims/services";
import {
  Application,
  AssessmentTriggerType,
  NoteType,
  OfferingStatus,
  StudentAssessment,
  StudentScholasticStanding,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import {
  SCHOLASTIC_STANDING_NOT_FOUND,
  SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED,
  SCHOLASTIC_STANDING_REVERSAL_NOT_UPDATED,
} from "../../constants";
import { DataSource, IsNull, Repository } from "typeorm";
import { SCHOLASTIC_STANDING_REVERSAL_ALLOWED_TRIGGER_TYPES } from "../../utilities";

/**
 * Service to handle scholastic standing reversal operations.
 */
@Injectable()
export class ScholasticStandingReversalService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentScholasticStanding)
    private readonly scholasticStandingRepo: Repository<StudentScholasticStanding>,
    private readonly noteSharedService: NoteSharedService,
  ) {}

  /**
   * Get scholastic standing details.
   * @param scholasticStandingId scholastic standing id.
   * @returns scholastic standing details.
   */
  private async getScholasticStanding(
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
          "student.id",
          "currentAssessment.id",
          "currentAssessment.triggerType",
          "studentAppeal.id",
          "offeringBeforeScholasticStanding.id",
          "parentOffering.id",
          "offeringVersion.id",
        ])
        .innerJoin("scholasticStanding.application", "application")
        .innerJoin("application.student", "student")
        .innerJoin("application.currentAssessment", "currentAssessment")
        .leftJoin("currentAssessment.studentAppeal", "studentAppeal")
        .leftJoin(
          "scholasticStanding.referenceOffering",
          "offeringBeforeScholasticStanding",
        )
        .leftJoin(
          "offeringBeforeScholasticStanding.parentOffering",
          "parentOffering",
        )
        // Current version of the offering that was associated with the application before the scholastic standing was reported.
        .leftJoin(
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

  /**
   * Reverse the scholastic standing.
   * @param scholasticStandingId scholastic standing id.
   * @param reversalNote note for the reversal.
   * @param auditUserId user who is making the changes.
   */
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
    // creates a re-assessment with updated study period end date and archives the application.
    // Hence to reverse those scholastic standings a re-assessment is required to reverse the study period changes
    // and the application archive status need to be set to false.
    const isReAssessmentAndArchiveUpdateRequired =
      scholasticStanding.changeType !==
      StudentScholasticStandingChangeType.StudentDidNotCompleteProgram;
    if (
      isReAssessmentAndArchiveUpdateRequired &&
      !SCHOLASTIC_STANDING_REVERSAL_ALLOWED_TRIGGER_TYPES.includes(
        currentAssessment.triggerType,
      )
    ) {
      throw new CustomNamedError(
        `Scholastic standing reversal is not allowed for change type ${
          scholasticStanding.changeType
        } as the current assessment trigger type is not among allowed trigger types ${SCHOLASTIC_STANDING_REVERSAL_ALLOWED_TRIGGER_TYPES.join(
          ", ",
        )} ${currentAssessment.triggerType}` +
          ` but ${currentAssessment.triggerType}.`,
        SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED,
      );
    }
    // Reversal of scholastic standing.
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const application = scholasticStanding.application;
      const auditUser = { id: auditUserId } as User;
      const now = new Date();
      if (isReAssessmentAndArchiveUpdateRequired) {
        // Current version of the offering that was associated with the application before the scholastic standing was reported.
        const [offeringBeforeScholasticStanding] =
          scholasticStanding.referenceOffering.parentOffering.versions;
        const reversalAssessment = new StudentAssessment();
        reversalAssessment.application = application;
        reversalAssessment.triggerType =
          AssessmentTriggerType.ScholasticStandingReversal;
        reversalAssessment.creator = auditUser;
        reversalAssessment.createdAt = now;
        reversalAssessment.submittedBy = auditUser;
        reversalAssessment.submittedDate = now;
        reversalAssessment.offering = offeringBeforeScholasticStanding;
        reversalAssessment.studentAppeal = currentAssessment.studentAppeal;

        // Create a new re-assessment to reverse the study period changes.
        application.currentAssessment = reversalAssessment;
        application.modifier = auditUser;
        application.updatedAt = now;
        // Set the archived status to false.
        application.isArchived = false;
        await transactionalEntityManager
          .getRepository(Application)
          .save(application);
      }
      // Create a note for the scholastic standing reversal.
      const note = await this.noteSharedService.createStudentNote(
        application.student.id,
        NoteType.Application,
        reversalNote,
        auditUserId,
        transactionalEntityManager,
      );
      // Update the scholastic standing with the reversal details.
      const updateResult = await transactionalEntityManager
        .getRepository(StudentScholasticStanding)
        .update(
          { id: scholasticStandingId, reversalDate: IsNull() },
          { reversalDate: now, reversalBy: auditUser, reversalNote: note },
        );
      if (!updateResult.affected) {
        throw new CustomNamedError(
          `Scholastic standing reversal is not updated for scholastic standing ${scholasticStandingId}.`,
          SCHOLASTIC_STANDING_REVERSAL_NOT_UPDATED,
        );
      }
    });
  }
}
