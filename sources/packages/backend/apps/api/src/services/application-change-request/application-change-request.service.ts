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
import { DataSource, EntityManager, In, Repository } from "typeorm";
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
        // Update the current assessment status to completed.
        // Get the current assessment ID first.
        const application = await transactionalEntityManager
          .getRepository(Application)
          .findOne({
            select: {
              id: true,
              currentAssessment: { id: true },
            },
            where: { id: applicationId },
            relations: {
              currentAssessment: true,
            },
          });
        await transactionalEntityManager
          .getRepository(StudentAssessment)
          .update(
            {
              id: application.currentAssessment.id,
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
      const {
        relatedApplicationId,
        relatedApplicationStatus,
        currentAssessment: relatedPrecedingCurrentAssessment,
      } = await this.getRelatedApplication(
        applicationId,
        transactionalEntityManager,
      );
      // Update the application status for the preceding application.
      // Only if it is the original application, its status should be changed to edited.
      if (relatedApplicationStatus === ApplicationStatus.Completed) {
        await transactionalEntityManager.getRepository(Application).update(
          {
            id: relatedApplicationId,
          },
          {
            applicationStatus: ApplicationStatus.Edited,
            modifier: auditUser,
            updatedAt: currentDate,
          },
        );
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
      // Copy the most recent offering id and the student appeal id
      // from the latest preceding application to the newly approved current application.
      const approvedApplicationModifiedCurrentAssessment = {
        ...relatedPrecedingCurrentAssessment,
        offeringId: relatedPrecedingCurrentAssessment.offering?.id,
        studentAppealId: relatedPrecedingCurrentAssessment.studentAppeal?.id,
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
      // Send a message to the workflow to proceed.
      await this.workflowClientService.sendApplicationChangeRequestStatusMessage(
        applicationId,
        applicationEditStatus,
      );
    });
  }

  /**
   * Get the most recent application with the same parent that has a
   * Change with approval or Original application edit status.
   * @param applicationId application id.
   * @param transactionalEntityManager transactional entity manager.
   * @returns the most recent application details with the same parent
   * that has a Change with approval or Original application edit status.
   */
  private async getRelatedApplication(
    applicationId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<{
    relatedApplicationId: number;
    relatedApplicationStatus: ApplicationStatus;
    currentAssessment: StudentAssessment;
  }> {
    // Get the application with its parent information first
    const currentApplication = await transactionalEntityManager
      .getRepository(Application)
      .findOne({
        select: { id: true, parentApplication: { id: true } },
        where: { id: applicationId },
        relations: { parentApplication: true },
      });
    // Get the most recent application with the same parent that has a
    // Change with approval or Original application edit status.
    const [latestRelatedApplication] = await transactionalEntityManager
      .getRepository(Application)
      .find({
        select: {
          id: true,
          applicationStatus: true,
          currentAssessment: {
            id: true,
            offering: { id: true },
            studentAppeal: { id: true },
          },
          submittedDate: true,
        },
        where: {
          parentApplication: { id: currentApplication.parentApplication.id },
          applicationEditStatus: In([
            ApplicationEditStatus.ChangedWithApproval,
            ApplicationEditStatus.Original,
          ]),
        },
        relations: {
          currentAssessment: {
            offering: true,
            studentAppeal: true,
          },
        },
        order: {
          submittedDate: "DESC",
        },
        take: 1,
      });
    // Extract the needed information
    const {
      id: relatedApplicationId,
      applicationStatus: relatedApplicationStatus,
      currentAssessment,
    } = latestRelatedApplication;
    return {
      relatedApplicationId,
      relatedApplicationStatus,
      currentAssessment,
    };
  }
}
