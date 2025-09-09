import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NoteSharedService, SystemUsersService } from "@sims/services";
import { Application, NoteType, ProgramInfoStatus } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { PIR_STATUS_ALREADY_SET } from "apps/workers/src/constants";
import { DataSource, IsNull, Repository } from "typeorm";

@Injectable()
export class ProgramInfoRequestService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly noteSharedService: NoteSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  async getPreviouslyApprovedPIROfferingId(
    currentPIRHash: string,
    parentApplicationId: number,
  ): Promise<Application | null> {
    return this.applicationRepo.findOne({
      select: {
        id: true,
        pirProgram: { id: true },
        currentAssessment: { id: true, offering: { id: true } },
      },
      relations: {
        pirProgram: true,
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

  /**
   * Updates the Program Information Request (PIR) for the first time.
   * @param applicationId application to have the PIR updated.
   * @param pirStatus status to be updated.
   * @param pirProgram optional program selected by the student.
   * When not provided the PIR will be required to be completed by
   * the institution.
   * @returns update result.
   */
  async updateProgramInfoStatus(
    applicationId: number,
    pirStatus: ProgramInfoStatus,
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
  async updatePreviouslyApprovedProgramInfoStatus(
    studentId: number,
    applicationId: number,
    pirApprovalReferenceId: number,
    pirProgram: number,
    offeringId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const now = new Date();
      // Update the application PIR information.
      const updateResultPromise = transactionalEntityManager
        .getRepository(Application)
        .update(
          {
            id: applicationId,
            pirStatus: IsNull(),
          },
          {
            pirStatus: ProgramInfoStatus.completed,
            pirProgram: { id: pirProgram },
            pirApprovalReference: { id: pirApprovalReferenceId },
            updatedAt: now,
            modifier: this.systemUsersService.systemUser,
            pirAssessedBy: this.systemUsersService.systemUser,
            pirAssessedDate: now,
            currentAssessment: { offering: { id: offeringId } },
          },
        );
      // Create a note for the student indicating that the PIR was automatically completed.
      const studentNotePromise = this.noteSharedService.createStudentNote(
        studentId,
        NoteType.Application,
        `Program information request automatically completed on "When PIR was completed".`,
        this.systemUsersService.systemUser.id,
        transactionalEntityManager,
      );
      const [updateResult] = await Promise.all([
        updateResultPromise,
        studentNotePromise,
      ]);
      if (!updateResult.affected) {
        throw new CustomNamedError(
          "PIR status was already set for the application.",
          PIR_STATUS_ALREADY_SET,
        );
      }
    });
  }
}
