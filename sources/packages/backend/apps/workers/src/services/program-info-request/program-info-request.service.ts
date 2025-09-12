import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NoteSharedService, SystemUsersService } from "@sims/services";
import {
  Application,
  NoteType,
  ProgramInfoStatus,
  StudentAssessment,
} from "@sims/sims-db";
import { CustomNamedError, getDateOnlyFormat } from "@sims/utilities";
import { PIR_STATUS_ALREADY_SET } from "apps/workers/src/constants";
import { DataSource, EntityManager, IsNull, Repository } from "typeorm";

@Injectable()
export class ProgramInfoRequestService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly noteSharedService: NoteSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Updates the Program Information Request (PIR) for the first time.
   * @param applicationId application to have the PIR updated.
   * @param pirStatus status to be updated.
   * @param pirHash hash of the application data.
   * @param pirProgram optional program selected by the student.
   * When not provided the PIR will be required to be completed by
   * the institution.
   * @returns update result.
   */
  async updateProgramInfoStatus(
    applicationId: number,
    pirStatus: ProgramInfoStatus,
    pirHash?: string,
    pirProgram?: number,
  ): Promise<void> {
    const updateResult = await this.applicationRepo.update(
      {
        id: applicationId,
        pirStatus: IsNull(),
      },
      {
        pirStatus,
        pirProgram: { id: pirProgram },
        pirHash,
        updatedAt: new Date(),
        modifier: this.systemUsersService.systemUser,
      },
    );
    if (!updateResult.affected) {
      throw new CustomNamedError(
        "PIR status was already set for the application.",
        PIR_STATUS_ALREADY_SET,
      );
    }
  }

  /**
   * Updates the Program Information Request (PIR) using the information
   * from a previously approved PIR.
   * @param applicationId application to have the PIR updated.
   * @param pirHash application data hash to find a previously approved PIR.
   * @returns true when the application was updated with the previously approved PIR,
   * false when no previously approved PIR was found.
   */
  async tryUpdateFromPreviouslyApprovedPIR(
    applicationId: number,
    pirHash: string,
  ): Promise<boolean> {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const application = await this.getPreviouslyApprovedPIRApplication(
          applicationId,
          pirHash,
          transactionalEntityManager,
        );
        // Check for previously approved PIR to reuse the information.
        if (!application?.parentApplication?.versions?.length) {
          return false;
        }
        // Update the application PIR information.
        const [previouslyApprovedPIR] = application.parentApplication.versions;
        const now = new Date();
        const updateApplicationPromise = transactionalEntityManager
          .getRepository(Application)
          .update(
            {
              id: applicationId,
              pirStatus: IsNull(),
            },
            {
              pirStatus: ProgramInfoStatus.completed,
              pirProgram: previouslyApprovedPIR.pirProgram,
              pirApprovalReference: { id: previouslyApprovedPIR.id },
              pirHash,
              updatedAt: now,
              modifier: this.systemUsersService.systemUser,
              pirAssessedBy: this.systemUsersService.systemUser,
              pirAssessedDate: now,
            },
          );
        // Update current assessment offering using the previously approved PIR assessment offering.
        const updateAssessmentPromise = transactionalEntityManager
          .getRepository(StudentAssessment)
          .update(
            {
              id: application.currentAssessment.id,
            },
            {
              offering: previouslyApprovedPIR.currentAssessment.offering,
              updatedAt: now,
              modifier: this.systemUsersService.systemUser,
            },
          );
        // Create a note for the student indicating that the PIR was automatically completed.
        const studentNotePromise = this.noteSharedService.createStudentNote(
          application.student.id,
          NoteType.Application,
          `Program information request automatically completed using information from previous request approved on ${getDateOnlyFormat(
            previouslyApprovedPIR.pirAssessedDate,
          )}.`,
          this.systemUsersService.systemUser.id,
          transactionalEntityManager,
        );
        // Execute all operations in parallel checking for the application result
        // to ensure that the PIR was not set in the meantime.
        const [updateApplicationResult] = await Promise.all([
          updateApplicationPromise,
          updateAssessmentPromise,
          studentNotePromise,
        ]);
        if (!updateApplicationResult.affected) {
          throw new CustomNamedError(
            "PIR status was already set for the application.",
            PIR_STATUS_ALREADY_SET,
          );
        }
        return true;
      },
    );
  }

  /**
   * Get information about the current application and a previously approved PIR.
   * @param applicationId application ID.
   * @param pirHash PIR hash.
   * @param entityManager Entity manager.
   * @returns application information or null if not found.
   */
  private async getPreviouslyApprovedPIRApplication(
    applicationId: number,
    pirHash: string,
    entityManager: EntityManager,
  ): Promise<Application | null> {
    const application = await entityManager.getRepository(Application).findOne({
      select: {
        id: true,
        parentApplication: {
          id: true,
          versions: {
            id: true,
            pirProgram: { id: true },
            pirAssessedDate: true,
            submittedDate: true,
            currentAssessment: { id: true, offering: { id: true } },
            createdAt: true,
          },
        },
        currentAssessment: { id: true, offering: { id: true } },
        student: { id: true },
      },
      relations: {
        parentApplication: {
          versions: {
            pirProgram: true,
            currentAssessment: { offering: true },
          },
        },
        currentAssessment: { offering: true },
        student: true,
      },
      where: {
        id: applicationId,
        parentApplication: {
          versions: {
            pirHash,
            pirStatus: ProgramInfoStatus.completed,
          },
        },
      },
      order: {
        parentApplication: {
          versions: {
            createdAt: "ASC",
          },
        },
      },
    });
    return application;
  }
}
