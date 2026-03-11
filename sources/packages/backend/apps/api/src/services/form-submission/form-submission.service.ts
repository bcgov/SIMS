import { Injectable } from "@nestjs/common";
import { Brackets, In, IsNull, Repository } from "typeorm";
import {
  FormCategory,
  FormSubmission,
  FormSubmissionStatus,
  getUserFullNameLikeSearch,
} from "@sims/sims-db";
import { FormSubmissionPendingSummary } from "./form-submission.models";
import { FieldSortOrder } from "@sims/utilities";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FormSubmissionPendingPaginationOptions,
  PaginatedResults,
} from "../../utilities";

/**
 * Manages how the form submissions are processed, including the validations,
 * ensuring the necessary supplementary data is loaded, and how the form
 * submission and related items are saved in the database.
 */
@Injectable()
export class FormSubmissionService {
  constructor(
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  /**
   * Gets all non-completed form submissions for a given application.
   * Pending or fully declined form submissions are considered non-completed, and are
   * usually displayed separated from the completed ones that potentially generated
   * assessment.
   * @param applicationId the application ID to filter the form submissions.
   * @param studentId optional student ID for data access authorization.
   * @returns a list of non-completed form submissions for the given application.
   */
  async getNonCompletedStudentAppeals(
    applicationId: number,
    studentId?: number,
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
      },
      where: {
        application: { id: applicationId },
        student: { id: studentId },
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: In([
          FormSubmissionStatus.Pending,
          FormSubmissionStatus.Declined,
        ]),
      },
    });
  }

  /**
   * Gets all pending student form submissions awaiting ministry review.
   * Each result represents a single {@link FormSubmission} and can include
   * multiple forms through an array of form names when a submission has more
   * than one associated form.
   * Only submissions with the specified category and status
   * {@link FormSubmissionStatus.Pending} are returned, and pagination/count
   * are based on the number of submissions, not the number of individual forms.
   * @param paginationOptions options to control pagination, sorting, and search.
   * @returns paginated list of pending form submissions across all categories, one entry per submission
   * with form names aggregated per submission.
   */
  async getPendingFormSubmissions(
    paginationOptions: FormSubmissionPendingPaginationOptions,
  ): Promise<PaginatedResults<FormSubmissionPendingSummary>> {
    const query = this.formSubmissionRepo
      .createQueryBuilder("formSubmission")
      .select([
        "formSubmission.id",
        "formSubmission.submittedDate",
        "student.id",
        "user.firstName",
        "user.lastName",
        "formSubmissionItem.id",
        "dynamicFormConfiguration.formDescription",
        "dynamicFormConfiguration.formType",
        "application.id",
        "application.applicationNumber",
      ])
      .innerJoin("formSubmission.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("formSubmission.formSubmissionItems", "formSubmissionItem")
      .innerJoin(
        "formSubmissionItem.dynamicFormConfiguration",
        "dynamicFormConfiguration",
      )
      .leftJoin("formSubmission.application", "application")
      .where("formSubmission.submissionStatus = :status", {
        status: FormSubmissionStatus.Pending,
      });

    if (paginationOptions.hasApplicationScope === true) {
      query.andWhere("application.id IS NOT NULL");
    } else if (paginationOptions.hasApplicationScope === false) {
      query.andWhere("application.id IS NULL");
    }

    if (paginationOptions.formCategory) {
      query.andWhere("formSubmission.formCategory = :formCategory", {
        formCategory: paginationOptions.formCategory,
      });
    }

    if (paginationOptions.searchCriteria) {
      const trimmedSearchCriteria = paginationOptions.searchCriteria.trim();
      query
        .andWhere(
          new Brackets((qb) =>
            qb
              .where(getUserFullNameLikeSearch())
              .orWhere("application.applicationNumber = :applicationNumber"),
          ),
        )
        .setParameter("searchCriteria", `%${trimmedSearchCriteria}%`)
        .setParameter("applicationNumber", trimmedSearchCriteria);
    }

    const sortFieldMapping: Record<string, string> = {
      submittedDate: "formSubmission.submittedDate",
      lastName: "user.lastName",
      applicationNumber: "application.applicationNumber",
    };
    const dbSortField =
      sortFieldMapping[paginationOptions.sortField ?? "submittedDate"] ??
      "formSubmission.submittedDate";

    query
      .orderBy(dbSortField, paginationOptions.sortOrder ?? FieldSortOrder.DESC)
      .skip(paginationOptions.page * paginationOptions.pageLimit)
      .take(paginationOptions.pageLimit);

    const [items, count] = await query.getManyAndCount();

    return {
      results: items.map((item) => ({
        formSubmissionId: item.id,
        studentId: item.student.id,
        submittedDate: item.submittedDate,
        firstName: item.student.user.firstName,
        lastName: item.student.user.lastName,
        formNames: item.formSubmissionItems.map(
          (formSubmissionItem) =>
            formSubmissionItem.dynamicFormConfiguration.formType as string,
        ),
        applicationId: item.application?.id,
        applicationNumber: item.application?.applicationNumber,
      })),
      count,
    };
  }

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param options at least one of this options should be provided..
   * - `studentId` ID of the student to have the data retrieved
   * - `formSubmissionId` allow searching for a specific form submission.
   * - `itemId` allow searching for a specific form submission item across all form submissions of the student,
   * and return the form submission details for the form submission that contains the item.
   * @param queryOptions.
   * - `locationIds` restrict forms with an application scope to the provided locations. Used for institutions to have access
   * only to the form submissions related to the locations they have access to.
   * - `includeDecisionHistory` includes the decision history of each form item.
   * @returns form submission details including individual form items and their details.
   */
  async getFormSubmissions(
    options: {
      studentId?: number;
      formSubmissionId?: number;
      itemId?: number;
    },
    queryOptions?: {
      locationIds?: number[];
      includeDecisionHistory?: boolean;
    },
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
        assessedDate: true,
        formCategory: true,
        application: {
          id: true,
          applicationNumber: true,
        },
        formSubmissionItems: {
          id: true,
          dynamicFormConfiguration: {
            id: true,
            formType: true,
            formCategory: true,
            formDefinitionName: true,
          },
          submittedData: true,
          updatedAt: true,
          currentDecision: {
            id: true,
            decisionStatus: true,
            decisionDate: true,
            decisionBy: { id: true, firstName: true, lastName: true },
            decisionNote: { id: true, description: true },
          },
          decisions: queryOptions?.includeDecisionHistory
            ? {
                id: true,
                decisionStatus: true,
                decisionDate: true,
                decisionBy: { id: true, firstName: true, lastName: true },
                decisionNote: { id: true, description: true },
              }
            : undefined,
        },
      },
      relations: {
        application: true,
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          currentDecision: { decisionBy: true, decisionNote: true },
          decisions: queryOptions?.includeDecisionHistory
            ? {
                decisionBy: true,
                decisionNote: true,
              }
            : undefined,
        },
      },
      where: {
        id: options?.formSubmissionId,
        formSubmissionItems: {
          id: options?.itemId,
        },
        student: { id: options?.studentId },
        application: {
          location: queryOptions?.locationIds
            ? [{ id: In(queryOptions.locationIds) }, { id: IsNull() }]
            : undefined,
        },
      },
      order: {
        submittedDate: "DESC",
        formSubmissionItems: {
          id: "ASC",
          decisions: queryOptions?.includeDecisionHistory
            ? { id: "DESC" }
            : undefined,
        },
      },
    });
  }
}
