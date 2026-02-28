import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionConfigurationsAPIOutDTO,
  FormSubmissionAPIInDTO,
  FormSupplementaryDataAPIInDTO,
  FormSupplementaryDataAPIOutDTO,
  FormSubmissionPendingSummaryAPIOutDTO,
  PaginatedResultsAPIOutDTO,
} from "@/services/http/dto";
import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  PaginationOptions,
} from "@/types";
import { getPaginationQueryString } from "@/helpers";

const MOCKED_SUBMISSIONS: FormSubmissionStudentAPIOutDTO[] = [
  {
    id: 1,
    formCategory: FormCategory.StudentAppeal,
    status: FormSubmissionStatus.Completed,
    applicationId: 123,
    applicationNumber: "2025000001",
    submittedDate: new Date("2025-01-01T10:00:00Z"),
    assessedDate: new Date("2025-01-05T15:30:00Z"),
    submissionItems: [
      {
        id: 1,
        formType: "Room and board costs",
        formCategory: FormCategory.StudentAppeal,
        decisionStatus: FormSubmissionDecisionStatus.Approved,
        dynamicFormConfigurationId: 71,
        submissionData: {},
        formDefinitionName: "roomandboardcostsappeal",
      },
      {
        id: 2,
        formType: "Step-parent waiver",
        formCategory: FormCategory.StudentAppeal,
        decisionStatus: FormSubmissionDecisionStatus.Approved,
        dynamicFormConfigurationId: 72,
        submissionData: {},
        formDefinitionName: "stepparentwaiverappeal",
      },
    ],
  },
  {
    id: 2,
    formCategory: FormCategory.StudentAppeal,
    status: FormSubmissionStatus.Pending,
    applicationId: 456,
    applicationNumber: "2025000002",
    submittedDate: new Date("2025-01-01T10:00:00Z"),
    assessedDate: new Date("2025-01-05T15:30:00Z"),
    submissionItems: [
      {
        id: 3,
        formType: "Modified independent",
        formCategory: FormCategory.StudentAppeal,
        decisionStatus: FormSubmissionDecisionStatus.Pending,
        dynamicFormConfigurationId: 73,
        submissionData: {},
        formDefinitionName: "modifiedindependentappeal",
      },
    ],
  },
  {
    id: 3,
    formCategory: FormCategory.StudentForm,
    status: FormSubmissionStatus.Declined,
    submittedDate: new Date("2025-01-01T10:00:00Z"),
    assessedDate: new Date("2025-01-05T15:30:00Z"),
    submissionItems: [
      {
        id: 4,
        formType: "Non-punitive withdrawal",
        formCategory: FormCategory.StudentForm,
        decisionStatus: FormSubmissionDecisionStatus.Declined,
        dynamicFormConfigurationId: 74,
        submissionData: {},
        formDefinitionName: "nonpunitivewithdrawalform",
      },
    ],
  },
];

/**
 * Http API client for Form Submissions.
 */
export class FormSubmissionApi extends HttpBaseClient {
  /**
   * Get all submission form configurations for student submission forms.
   * @returns form configurations that allow student submissions.
   */
  async getSubmissionForms(): Promise<FormSubmissionConfigurationsAPIOutDTO> {
    return this.getCall(this.addClientRoot("form-submission/forms"));
  }

  // TODO: To be implemented.
  async getFormSubmissionSummary(): Promise<FormSubmissionStudentSummaryAPIOutDTO> {
    return {
      submissions: MOCKED_SUBMISSIONS,
    };
  }

  // TODO: To be implemented.
  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO> {
    return MOCKED_SUBMISSIONS.find(
      (submission) => submission.id === formSubmissionId,
    )!;
  }

  /**
   * Get supplementary data for the given data keys and application ID if provided.
   * @param query data keys and application ID to retrieve the supplementary data for.
   * @returns supplementary data for the given data keys and application ID.
   */
  async getSupplementaryData(
    query: FormSupplementaryDataAPIInDTO,
  ): Promise<FormSupplementaryDataAPIOutDTO> {
    let url = `form-submission/supplementary-data?dataKeys=${query.dataKeys.toString()}`;
    if (query.applicationId) {
      url += `&applicationId=${query.applicationId}`;
    }
    return this.getCall(this.addClientRoot(url));
  }

  /**
   * Submits forms represents appeals or other students forms for Ministry's decision.
   * The submission will be processed based on the form category and the related business rules.
   * @param payload form submission with one or more form items.
   */
  async submitForm(payload: FormSubmissionAPIInDTO): Promise<void> {
    await this.postCall(this.addClientRoot("form-submission"), payload);
  }

  /**
   * Gets all pending form submissions for ministry review.
   * @param paginationOptions options to execute the pagination.
   * @returns paginated list of pending form submissions.
   */
  async getPendingFormSubmissions(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<FormSubmissionPendingSummaryAPIOutDTO>> {
    const url = `form-submission/pending?${getPaginationQueryString(paginationOptions)}`;
    return this.getCall<
      PaginatedResultsAPIOutDTO<FormSubmissionPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
