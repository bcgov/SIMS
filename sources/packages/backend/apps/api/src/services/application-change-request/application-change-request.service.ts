import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationEditStatus,
  NoteType,
  User,
} from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";
import { NoteSharedService } from "@sims/services";

/**
 * Service responsible for application change request operations.
 */
@Injectable()
export class ApplicationChangeRequestService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly noteSharedService: NoteSharedService,
  ) {}

  /**
   * Validates the application change request for the given student and application change request status.
   * @param applicationId application id.
   * @param options method options:
   * `studentId`: student id for authorization.
   * `applicationChangeRequestStatus`: application change request status for authorization.
   * @returns true if the student is authorized for the given application change request status.
   */
  async applicationChangeRequestExists(
    applicationId: number,
    options?: {
      studentId?: number;
      applicationChangeRequestStatus?: ApplicationEditStatus;
    },
  ): Promise<boolean> {
    return this.applicationRepo.exists({
      where: {
        id: applicationId,
        applicationEditStatus: options?.applicationChangeRequestStatus,
        student: { id: options?.studentId },
      },
    });
  }

  /**
   * Assess the application change request status for the given application change request for the ministry user.
   * @param applicationId application id for which to update the status.
   * @param studentId student id for which to update the status.
   * @param applicationEditStatus the application edit status to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   */
  async updateApplicationChangeRequestStatus(
    applicationId: number,
    studentId: number,
    applicationEditStatus:
      | ApplicationEditStatus.ChangedWithApproval
      | ApplicationEditStatus.ChangeDeclined,
    note: string,
    auditUserId: number,
  ): Promise<void> {
    const auditUser = { id: auditUserId } as User;
    const currentDate = new Date();
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Save the note.
      await this.noteSharedService.createStudentNote(
        studentId,
        NoteType.Application,
        note,
        auditUserId,
        transactionalEntityManager,
      );
      // Update the application edit status.
      await transactionalEntityManager.getRepository(Application).update(
        {
          id: applicationId,
        },
        {
          applicationEditStatus,
          modifier: auditUser,
          updatedAt: currentDate,
        },
      );
    });
  }
}
