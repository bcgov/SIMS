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
import { ApplicationService } from "../application/application.service";
import {
  APPLICATION_NOT_FOUND,
  INVALID_APPLICATION_EDIT_STATUS,
} from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";

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
    private readonly applicationService: ApplicationService,
  ) {}

  /**
   * Assess the application change request status for the given application change request for the ministry user.
   * @param applicationId application id for which to update the status.
   * @param applicationEditStatus the application edit status to be updated.
   * @param note note to be saved.
   * @param auditUserId user that should be considered the one that is causing the changes.
   */
  async updateApplicationChangeRequestStatus(
    applicationId: number,
    applicationEditStatus:
      | ApplicationEditStatus.ChangedWithApproval
      | ApplicationEditStatus.ChangeDeclined,
    note: string,
    auditUserId: number,
  ): Promise<void> {
    // Get the application by id.
    const changeRequestApplication =
      await this.applicationService.getApplicationById(applicationId, {
        allowEdited: true,
      });
    if (!changeRequestApplication) {
      throw new CustomNamedError(
        `Application ${applicationId} to assess change not found.`,
        APPLICATION_NOT_FOUND,
      );
    }
    if (
      changeRequestApplication.applicationEditStatus !==
      ApplicationEditStatus.ChangePendingApproval
    ) {
      throw new CustomNamedError(
        `Application ${applicationId} to assess change not in valid status to be updated.`,
        INVALID_APPLICATION_EDIT_STATUS,
      );
    }
    const auditUser = { id: auditUserId } as User;
    const currentDate = new Date();
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Save the note.
      await this.noteSharedService.createStudentNote(
        changeRequestApplication.student.id,
        NoteType.Application,
        note,
        auditUserId,
        transactionalEntityManager,
      );
      const applicationRepo =
        transactionalEntityManager.getRepository(Application);
      if (applicationEditStatus === ApplicationEditStatus.ChangeDeclined) {
        // Update the application edit status.
        const updateResult = await applicationRepo.update(
          {
            id: applicationId,
            applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
          },
          {
            applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
            modifier: auditUser,
            updatedAt: currentDate,
            applicationEditStatusUpdatedBy: auditUser,
            applicationEditStatusUpdatedOn: currentDate,
          },
        );
        if (!updateResult.affected) {
          throw new CustomNamedError(
            `Application ${applicationId} to assess change not in valid status to be updated.`,
            INVALID_APPLICATION_EDIT_STATUS,
          );
        }
        // End the workflow.
        await this.workflowClientService.sendApplicationChangeRequestStatusMessage(
          applicationId,
          applicationEditStatus,
        );
        return;
      }
      const previousCompletedApplication =
        changeRequestApplication.precedingApplication;
      const newApplicationCurrentAssessment =
        changeRequestApplication.currentAssessment;
      // Copy the most recent offering id and the student appeal id
      // from the latest preceding application to the newly approved current application.
      newApplicationCurrentAssessment.offering = {
        id: previousCompletedApplication.currentAssessment.offering.id,
      } as EducationProgramOffering;
      if (previousCompletedApplication.currentAssessment.studentAppeal) {
        newApplicationCurrentAssessment.studentAppeal = {
          id: previousCompletedApplication.currentAssessment.studentAppeal.id,
        } as StudentAppeal;
      }
      // Update the previously completed application to be in Edited status.
      const previousApplicationUpdatePromise = applicationRepo.update(
        {
          id: previousCompletedApplication.id,
        },
        {
          applicationStatus: ApplicationStatus.Edited,
          modifier: auditUser,
          updatedAt: currentDate,
        },
      );
      // Update the newly completed approved application to be in Edited status.
      const currentApplicationUpdatePromise = applicationRepo.update(
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
          applicationStatusUpdatedOn: currentDate,
          applicationEditStatusUpdatedBy: auditUser,
          applicationEditStatusUpdatedOn: currentDate,
        },
      );
      const [, currentApplicationUpdateResult] = await Promise.all([
        previousApplicationUpdatePromise,
        currentApplicationUpdatePromise,
      ]);
      if (!currentApplicationUpdateResult.affected) {
        throw new CustomNamedError(
          `Application ${applicationId} to assess change not in valid status to be updated.`,
          INVALID_APPLICATION_EDIT_STATUS,
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
