import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationEditStatus,
  ApplicationStatus,
  NoteType,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";
import { NoteSharedService, WorkflowClientService } from "@sims/services";
import { ApplicationService } from "../application/application.service";

/**
 * Service responsible for application change request operations.
 */
@Injectable()
export class ApplicationChangeRequestService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly applicationService: ApplicationService,
    private readonly noteSharedService: NoteSharedService,
    private readonly workflowClientService: WorkflowClientService,
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
      if (applicationEditStatus === ApplicationEditStatus.ChangeDeclined) {
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
        // Update the assessment status to completed.
        await transactionalEntityManager
          .getRepository(StudentAssessment)
          .update(
            {
              application: { id: applicationId },
            },
            {
              studentAssessmentStatus: StudentAssessmentStatus.Completed,
              modifier: auditUser,
              updatedAt: currentDate,
            },
          );
        // End the workflow.
        await this.workflowClientService.sendApplicationChangeRequestStatusMessage(
          applicationId,
          applicationEditStatus,
        );
        return;
      }
      // Update the application edit status when the application change request is approved.
      await transactionalEntityManager.getRepository(Application).update(
        {
          id: applicationId,
        },
        {
          applicationEditStatus,
          applicationStatus: ApplicationStatus.Completed,
          modifier: auditUser,
          updatedAt: currentDate,
        },
      );
      const {
        precedingApplication,
        currentAssessment: approvedApplicationCurrentAssessment,
      } = await this.applicationService.getApplicationById(applicationId);
      // Update the application status for the preceding application.
      await transactionalEntityManager.getRepository(Application).update(
        {
          id: precedingApplication.id,
        },
        {
          applicationStatus: ApplicationStatus.Edited,
          modifier: auditUser,
          updatedAt: currentDate,
        },
      );
      const { currentAssessment } =
        await this.applicationService.getApplicationById(
          precedingApplication.id,
        );
      // Copy the most recent offering id and the student appeal id
      // from the preceding application to the newly approved current application.
      const approvedApplicationModifiedCurrentAssessment = {
        ...approvedApplicationCurrentAssessment,
        offeringId: currentAssessment.offering.id,
        studentAppealId: currentAssessment.studentAppeal.id,
      };
      await transactionalEntityManager.getRepository(Application).update(
        {
          id: applicationId,
        },
        {
          currentAssessment: approvedApplicationModifiedCurrentAssessment,
          modifier: auditUser,
          updatedAt: currentDate,
        },
      );
    });
  }
}
