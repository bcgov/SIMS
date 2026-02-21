import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionConfigurationsAPIOutDTO,
  FormSubmissionAPIInDTO,
  FormSupplementaryDataAPIInDTO,
  FormSupplementaryDataAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionItemDecisionAPIOutDTO,
} from "@/services/http/dto";
import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
} from "@/types";

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

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * For the ministry, it is using during the approval process, providing the necessary details for
   * the decision making on each form item.
   * For the student, it is used to show the details of their submission, including the decision made
   * on each form item.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * for Ministry users to review and make decisions on each form item, also providing the data
   * for visualization of the form submission details.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @returns form submission details including individual form items and their details.
   */
  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO | FormSubmissionMinistryAPIOutDTO> {
    return this.getCall(
      this.addClientRoot(`form-submission/${formSubmissionId}`),
    );
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
   * Updates an individual form item in the form submission with the decision made by the Ministry, including the decision status and note.
   * @param formSubmissionItemId ID of the form submission item to update the decision for.
   * @param payload decision status and note description for the form submission item.
   * @param userToken user token containing the user ID of the Ministry user making the decision, used for auditing purposes.
   */
  async submitItemDecision(
    formSubmissionItemId: number,
    payload: FormSubmissionItemDecisionAPIInDTO,
  ): Promise<FormSubmissionItemDecisionAPIOutDTO> {
    return this.patchCall(
      this.addClientRoot(
        `form-submission/items/${formSubmissionItemId}/decision`,
      ),
      payload,
    );
  }

  /**
   * Updates the form submission status to completed when all the related form items have been decided,
   * and executes the related business logic such as sending notification.
   * This is the final step of the form submission approval process for the Ministry, which indicates that
   * all decisions on the form items have been made and the form submission is completed.
   * @param formSubmissionId ID of the form submission to be completed.
   */
  async completeFormSubmission(formSubmissionId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`form-submission/${formSubmissionId}/complete`),
      null,
    );
  }
}
