import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationEditStatus,
  ApplicationStatus,
  EducationProgramOffering,
  NoteType,
  StudentAppeal,
  User,
} from "@sims/sims-db";
import { DataSource, Repository } from "typeorm";
import { NoteSharedService, WorkflowClientService } from "@sims/services";

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
   * @param note note to be saved.
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
        const updateResult = await transactionalEntityManager
          .getRepository(Application)
          .update(
            {
              id: applicationId,
              applicationEditStatus:
                ApplicationEditStatus.ChangePendingApproval,
            },
            {
              applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
              modifier: auditUser,
              updatedAt: currentDate,
            },
          );
        if (!updateResult.affected) {
          throw new Error(
            `Application ${applicationId} to assess change not found or not in valid status to be updated.`,
          );
        }
        // End the workflow.
        await this.workflowClientService.sendApplicationChangeRequestStatusMessage(
          applicationId,
          applicationEditStatus,
        );
        return;
      }
      const changeRequestApplication = await this.applicationRepo.findOne({
        select: {
          id: true,
          applicationEditStatus: true,
          precedingApplication: {
            id: true,
            currentAssessment: { id: true },
          },
          currentAssessment: {
            id: true,
          },
        },
        relations: {
          currentAssessment: true,
          precedingApplication: {
            currentAssessment: true,
          },
        },
        where: {
          id: applicationId,
        },
      });
      const previousCompletedApplication =
        changeRequestApplication.precedingApplication;
      const previousCompletedApplicationId = previousCompletedApplication.id;
      const previousCompletedApplicationCurrentAssessment =
        previousCompletedApplication.currentAssessment;
      const newApplicationCurrentAssessment =
        changeRequestApplication.currentAssessment;
      // Copy the most recent offering id and the student appeal id
      // from the latest preceding application to the newly approved current application.
      newApplicationCurrentAssessment.offering = {
        id: previousCompletedApplicationCurrentAssessment.offering?.id,
      } as EducationProgramOffering;
      if (previousCompletedApplicationCurrentAssessment.studentAppeal) {
        newApplicationCurrentAssessment.studentAppeal = {
          id: previousCompletedApplicationCurrentAssessment.studentAppeal.id,
        } as StudentAppeal;
      }
      // Update the previously completed application to be in Edited status.
      await transactionalEntityManager.getRepository(Application).update(
        {
          id: previousCompletedApplicationId,
        },
        {
          applicationStatus: ApplicationStatus.Edited,
          modifier: auditUser,
          updatedAt: currentDate,
        },
      );
      const updateResult = await transactionalEntityManager
        .getRepository(Application)
        .update(
          {
            id: applicationId,
            applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
          },
          {
            applicationEditStatus: ApplicationEditStatus.ChangedWithApproval,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessment: newApplicationCurrentAssessment,
            modifier: auditUser,
            updatedAt: currentDate,
          },
        );
      if (!updateResult.affected) {
        throw new Error(
          `Application ${applicationId} to assess change not found or not in valid status to be updated.`,
        );
      }
      // Send a message to the workflow to proceed.
      await this.workflowClientService.sendApplicationChangeRequestStatusMessage(
        applicationId,
        applicationEditStatus,
      );
    });
  }
}
