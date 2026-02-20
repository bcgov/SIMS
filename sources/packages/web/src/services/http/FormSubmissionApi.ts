import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  FormSubmissionStudentSummaryAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
  FormSubmissionConfigurationsAPIOutDTO,
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

  // TODO: To be implemented.
  async getFormSubmission(
    formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO> {
    return MOCKED_SUBMISSIONS.find(
      (submission) => submission.id === formSubmissionId,
    )!;
  }
}
