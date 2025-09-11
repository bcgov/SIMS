import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NoteSharedService, SystemUsersService } from "@sims/services";
import {
  Application,
  NoteType,
  ProgramInfoStatus,
  StudentAssessment,
} from "@sims/sims-db";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
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
   * @param pirApprovalReferenceId application that approved the PIR previously.
   * @param pirProgram program selected by the student during the previous PIR.
   * @param offeringId offering ID that was approved during the previous PIR. Please
   * note that the offering ID may not belong to the program selected by the student
   * by the student as the institution may have approved a different program.
   */
  async tryUpdateFromPreviouslyApprovedProgramInfoStatus(
    applicationId: number,
    pirHash: string,
  ): Promise<boolean> {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // Check for previously approved PIR to reuse the information.
        const previouslyApprovedPIR =
          await this.getPreviouslyApprovedPIRApplication(
            pirHash,
            applicationId,
            transactionalEntityManager,
          );
        if (!previouslyApprovedPIR) {
          return false;
        }
        // Update the application PIR information.
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
        // Update current offering.
        const updateAssessmentPromise = transactionalEntityManager
          .getRepository(StudentAssessment)
          .update(
            {
              id: previouslyApprovedPIR.currentAssessment.id,
            },
            {
              offering: previouslyApprovedPIR.currentAssessment.offering,
              updatedAt: now,
              modifier: this.systemUsersService.systemUser,
            },
          );
        // Create a note for the student indicating that the PIR was automatically completed.
        const studentNotePromise = this.noteSharedService.createStudentNote(
          previouslyApprovedPIR.student.id,
          NoteType.Application,
          `Program information request automatically completed on ${getISODateOnlyString(
            previouslyApprovedPIR.pirApprovalReference.pirAssessedDate,
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

  private async getPreviouslyApprovedPIRApplication(
    currentPIRHash: string,
    parentApplicationId: number,
    entityManager: EntityManager,
  ): Promise<Application | null> {
    return entityManager.getRepository(Application).findOne({
      select: {
        id: true,
        pirProgram: { id: true },
        submittedDate: true,
        currentAssessment: { id: true, offering: { id: true } },
        student: { id: true },
      },
      relations: {
        pirProgram: true,
        student: true,
        currentAssessment: { offering: true },
      },
      where: {
        pirHash: currentPIRHash,
        pirStatus: ProgramInfoStatus.completed,
        parentApplication: { id: parentApplicationId },
      },
      order: { submittedDate: "ASC" },
    });
  }
}
