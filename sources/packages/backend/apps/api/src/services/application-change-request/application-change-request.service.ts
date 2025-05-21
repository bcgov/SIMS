import { Injectable } from "@nestjs/common";
import {
  Application,
  ApplicationEditStatus,
  ApplicationStatus,
  EducationProgramOffering,
  getUserFullNameLikeSearch,
  NoteType,
  StudentAppeal,
  User,
} from "@sims/sims-db";
import { Brackets, DataSource, Repository, SelectQueryBuilder } from "typeorm";
import { NoteSharedService, WorkflowClientService } from "@sims/services";
import { ApplicationService } from "../application/application.service";
import {
  APPLICATION_NOT_FOUND,
  INVALID_APPLICATION_EDIT_STATUS,
} from "@sims/services/constants";
import { CustomNamedError, FieldSortOrder } from "@sims/utilities";
import { PaginatedResults, PaginationOptions } from "../../utilities";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service responsible for application change request operations.
 */
@Injectable()
export class ApplicationChangeRequestService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
    private readonly workflowClientService: WorkflowClientService,
    private readonly applicationService: ApplicationService,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
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
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const applicationRepo =
        transactionalEntityManager.getRepository(Application);
      // Prevents other changes in the application change request
      // while this transaction is being processed.
      await this.applicationService.getApplicationLock(
        transactionalEntityManager,
        applicationId,
      );
      // Get the application by id.
      const changeRequestApplication =
        await this.applicationService.getApplicationById(applicationId, {
          allowEdited: true,
          entityManager: transactionalEntityManager,
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
      // Save the note.
      await this.noteSharedService.createStudentNote(
        changeRequestApplication.student.id,
        NoteType.Application,
        note,
        auditUserId,
        transactionalEntityManager,
      );
      if (applicationEditStatus === ApplicationEditStatus.ChangeDeclined) {
        // Update the application edit status.
        changeRequestApplication.applicationEditStatus =
          ApplicationEditStatus.ChangeDeclined;
        changeRequestApplication.modifier = auditUser;
        changeRequestApplication.updatedAt = currentDate;
        changeRequestApplication.applicationEditStatusUpdatedBy = auditUser;
        changeRequestApplication.applicationEditStatusUpdatedOn = currentDate;
        await applicationRepo.save(changeRequestApplication);
        return;
      }
      // Previously completed application that will be replaced by the newly approved application change request.
      const completedApplication =
        changeRequestApplication.precedingApplication;
      completedApplication.applicationStatus = ApplicationStatus.Edited;
      completedApplication.modifier = auditUser;
      completedApplication.updatedAt = currentDate;
      // Update the approved change request to become the new completed application.
      // Application edit status related properties.
      changeRequestApplication.applicationEditStatus =
        ApplicationEditStatus.ChangedWithApproval;
      changeRequestApplication.applicationEditStatusUpdatedOn = currentDate;
      changeRequestApplication.applicationEditStatusUpdatedBy = auditUser;
      // Application status related properties.
      changeRequestApplication.applicationStatus = ApplicationStatus.Completed;
      changeRequestApplication.applicationStatusUpdatedOn = currentDate;
      changeRequestApplication.modifier = auditUser;
      changeRequestApplication.updatedAt = currentDate;
      // Update the current assessment of the preceding application
      // with most recent offering ID and student appeal ID to update
      // the current assessment of the new completed application.
      const copyFromAssessment = completedApplication.currentAssessment;
      changeRequestApplication.currentAssessment.offering = {
        id: copyFromAssessment.offering.id,
      } as EducationProgramOffering;
      if (copyFromAssessment.studentAppeal) {
        changeRequestApplication.currentAssessment.studentAppeal = {
          id: copyFromAssessment.studentAppeal.id,
        } as StudentAppeal;
      }
      await applicationRepo.save(changeRequestApplication);
    });
    // Send a message to the workflow to proceed.
    await this.workflowClientService.sendApplicationChangeRequestStatusMessage(
      applicationId,
      applicationEditStatus,
    );
  }

  /**
   * Gets applications based purely on their edit status.
   * @param applicationEditStatus The application edit status to filter.
   * @param paginationOptions Pagination, sorting, and search options from the controller.
   * @returns Paginated list of applications.
   */
  async getApplicationsByEditStatus(
    applicationEditStatus: ApplicationEditStatus,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<Application>> {
    const { page, pageLimit, sortField, sortOrder, searchCriteria } =
      paginationOptions;

    const query = this.applicationRepo
      .createQueryBuilder("application")
      .select([
        "application.id",
        "application.applicationNumber",
        "application.submittedDate",
        "student.id",
        "user.firstName",
        "user.lastName",
        "precedingApplication.id",
      ])
      .innerJoin("application.student", "student")
      .innerJoin("application.precedingApplication", "precedingApplication")
      .innerJoin("student.user", "user")
      .where("application.applicationEditStatus = :applicationEditStatus", {
        applicationEditStatus,
      })
      .offset(page * pageLimit)
      .limit(pageLimit);

    if (searchCriteria) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(
            getUserFullNameLikeSearch("user", "searchQueryParam"),
          ).orWhere("application.applicationNumber ILIKE :searchQueryParam", {
            searchQueryParam: `%${searchCriteria.trim()}%`,
          });
        }),
      );
    }

    this.addApplicationChangeRequestSort(query, sortField, sortOrder);

    const [results, count] = await query.getManyAndCount();
    return { results, count };
  }

  /**
   * Adds sorting to the application change request query.
   * @param query Query builder.
   * @param sortField Field to be sorted.
   * @param sortOrder Sort order (ASC/DESC).
   */
  private addApplicationChangeRequestSort(
    query: SelectQueryBuilder<Application>,
    sortField?: string,
    sortOrder?: FieldSortOrder,
  ): void {
    let dbSortField: string;
    switch (sortField) {
      case "submittedDate":
        dbSortField = "application.submittedDate";
        break;
      case "lastName":
        dbSortField = "user.lastName";
        break;
      case "applicationNumber":
        dbSortField = "application.applicationNumber";
        break;
      default:
        dbSortField = "application.submittedDate";
        break;
    }
    const order = sortOrder ?? FieldSortOrder.ASC;
    query.orderBy(dbSortField, order);
  }
}
