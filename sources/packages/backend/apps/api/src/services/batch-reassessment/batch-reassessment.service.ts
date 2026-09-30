import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationStatus,
  BatchReassessment,
  BatchReassessmentApplication,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";
import {
  BatchReassessmentStatus,
  BatchReassessmentSummary,
} from "./batch-reassessment.service.models";
import { SequenceControlService } from "@sims/services";
import { APPLICATION_NOT_FOUND } from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";
import { StudentAssessmentService } from "../student-assessment/student-assessment.service";
import { InjectRepository } from "@nestjs/typeorm/dist/common/typeorm.decorators";

const BATCH_REASSESSMENT_NUMBER_SEQUENCE_NAME = "BATCH_REASSESSMENT_NUMBER";

/**
 * Provides batch manual reassessment retrieval operations.
 */
@Injectable()
export class BatchReassessmentService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(BatchReassessment)
    private readonly batchReassessmentRepo: Repository<BatchReassessment>,
    private readonly sequenceService: SequenceControlService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  /**
   * Gets persisted batch manual reassessment submissions and their associated applications.
   * @returns batch manual reassessment submissions.
   */
  async getBatchReassessmentSummaries(): Promise<BatchReassessmentSummary[]> {
    const rows = await this.batchReassessmentRepo
      .createQueryBuilder("batchReassessment")
      .select("batchReassessment.id", "id")
      .addSelect("batchReassessment.batchNumber", "batchNumber")
      .addSelect("batchReassessment.createdAt", "createdAt")
      .addSelect("creator.firstName", "creatorFirstName")
      .addSelect("creator.lastName", "creatorLastName")
      .addSelect(
        `COUNT("batchReassessmentApplication"."id")::int`,
        "totalCount",
      )
      .addSelect(
        `COUNT(CASE WHEN "studentAssessment"."student_assessment_status" IN (:...successStatuses) THEN 1 END)::int`,
        "successCount",
      )
      .addSelect(
        `COUNT(CASE WHEN "studentAssessment"."id" IS NULL THEN 1 END)::int`,
        "failureCount",
      )
      .leftJoin(
        "batchReassessment.batchReassessmentApplications",
        "batchReassessmentApplication",
      )
      .leftJoin(
        "batchReassessmentApplication.studentAssessment",
        "studentAssessment",
      )
      .leftJoin("batchReassessment.creator", "creator")
      .setParameter("successStatuses", [
        StudentAssessmentStatus.Completed,
        StudentAssessmentStatus.Cancelled,
      ])
      .groupBy("batchReassessment.id")
      .addGroupBy("creator.id")
      .orderBy("batchReassessment.createdAt", "DESC")
      .getRawMany<Omit<BatchReassessmentSummary, "status">>();

    const summaries: BatchReassessmentSummary[] = rows.map((row) => ({
      ...row,
      status:
        row.totalCount === row.successCount + row.failureCount
          ? BatchReassessmentStatus.Completed
          : BatchReassessmentStatus.InProgress,
    }));

    return summaries;
  }
  /**
   * Runs a batch reassessment for a list of application numbers.
   * Each application number is processed independently so failures do not stop
   * the remaining batch items from being attempted.
   * @param applicationNumbers application numbers to be reassessed.
   * @param note note describing the reason for the batch reassessment.
   * @param userId user id who triggered the batch reassessment.
   */
  async createBatchReassessment(
    applicationNumbers: string[],
    note: string,
    userId: number,
  ): Promise<BatchReassessment> {
    // Only process distinct application numbers.
    const distinctApplicationNumbers = [...new Set(applicationNumbers)];
    const applicationIdsByNumber = await this.getApplicationIdsByNumber(
      distinctApplicationNumbers,
    );

    let savedBatchReassessment: BatchReassessment;
    return this.dataSource.transaction(async (entityManager) => {
      // Consumes the next sequence number and blocks concurrent creation of a BatchReassessment
      // while the sequence is locked. All the code in the callback will be executed within the
      // transaction and under the sequence lock.
      await this.sequenceService.consumeNextSequenceWithExistingEntityManager(
        BATCH_REASSESSMENT_NUMBER_SEQUENCE_NAME,
        entityManager,
        async (nextSequenceNumber: number) => {
          const now = new Date();
          const creator = { id: userId } as User;
          // Create a new batch reassessment.
          const batchReassessment = new BatchReassessment();
          batchReassessment.batchNumber = nextSequenceNumber;
          batchReassessment.creator = creator;
          batchReassessment.createdAt = now;
          batchReassessment.updatedAt = now;
          savedBatchReassessment = await entityManager
            .getRepository(BatchReassessment)
            .save(batchReassessment);

          for (const applicationNumber of distinctApplicationNumbers) {
            const applicationId = applicationIdsByNumber.get(applicationNumber);
            const batchReassessmentApplication =
              new BatchReassessmentApplication();
            // Always persist the applicationNumber for convenience, even though it can be determined
            // from the assessment for successful applications.
            batchReassessmentApplication.applicationNumber = applicationNumber;
            batchReassessmentApplication.batchReassessment =
              savedBatchReassessment;
            batchReassessmentApplication.creator = creator;
            batchReassessmentApplication.createdAt = now;
            batchReassessmentApplication.updatedAt = now;

            try {
              // Fail early if the application id doesn't exist as createManualReassessment doesn't handle undefined gracefully.
              if (!applicationId) {
                throw new CustomNamedError(
                  "Application not found",
                  APPLICATION_NOT_FOUND,
                );
              }
              const studentAssessment =
                await this.studentAssessmentService.createManualReassessment(
                  applicationId,
                  note,
                  userId,
                  entityManager,
                );
              batchReassessmentApplication.studentAssessment =
                studentAssessment;
            } catch (error) {
              batchReassessmentApplication.failureReason =
                error?.message ?? "Unknown error";
            }
            await entityManager
              .getRepository(BatchReassessmentApplication)
              .save(batchReassessmentApplication);
          }
        },
      );
      return savedBatchReassessment;
    });
  }

  /**
   * Retrieves the application Ids of the current application for the given application numbers.
   * @param applicationNumbers The list of application numbers to retrieve IDs for.
   * @returns A map where the keys are application numbers and the values are the corresponding application IDs.
   */
  private async getApplicationIdsByNumber(
    applicationNumbers: string[],
  ): Promise<Map<string, number>> {
    const applications = await this.applicationRepo
      .createQueryBuilder("application")
      .select(["application.id", "application.applicationNumber"])
      .where("application.applicationNumber IN (:...applicationNumbers)", {
        applicationNumbers: applicationNumbers,
      })
      .andWhere("application.applicationStatus != :editedStatus", {
        editedStatus: ApplicationStatus.Edited,
      })
      .getMany();
    return new Map(
      applications.map((application) => [
        application.applicationNumber,
        application.id,
      ]),
    );
  }
}
