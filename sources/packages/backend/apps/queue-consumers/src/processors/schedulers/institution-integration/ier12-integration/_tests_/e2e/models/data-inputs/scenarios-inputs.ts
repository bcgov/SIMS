import {
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  RelationshipStatus,
} from "@sims/sims-db";
import { IER12TestInputData } from "./data-inputs.models";
import {
  ASSESSMENT_DATA_SINGLE_INDEPENDENT,
  AWARDS_ONE_OF_TWO_DISBURSEMENT,
  AWARDS_TWO_OF_TWO_DISBURSEMENT,
  JOHN_DOE_FROM_CANADA,
  OFFERING_2023_2024_SET_DEC_FULL_TIME,
  PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
  WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
} from ".";

export const STUDENT_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS_2023_2024: IER12TestInputData =
  {
    student: JOHN_DOE_FROM_CANADA,
    application: {
      applicationNumber: "9879879879",
      studentNumber: "12345678",
      relationshipStatus: RelationshipStatus.Single,
      submittedDate: new Date("2023-10-20"),
      applicationStatus: ApplicationStatus.Completed,
      applicationStatusUpdatedOn: new Date("2023-10-21"),
      programYear: "2023-2024",
    },
    assessment: {
      triggerType: AssessmentTriggerType.OriginalAssessment,
      assessmentDate: new Date("2023-10-22"),
      workflowData: WORKFLOW_DATA_SINGLE_INDEPENDENT_WITH_NO_DEPENDENTS,
      assessmentData: ASSESSMENT_DATA_SINGLE_INDEPENDENT,
      disbursementSchedules: [
        {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          disbursementDate: "2023-01-23",
          updatedAt: new Date("2023-01-24"),
          dateSent: new Date("2023-01-18"),
          disbursementValues: AWARDS_ONE_OF_TWO_DISBURSEMENT,
        },
        {
          coeStatus: COEStatus.required,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          disbursementDate: "2023-06-23",
          updatedAt: new Date("2023-06-24"),
          dateSent: undefined,
          disbursementValues: AWARDS_TWO_OF_TWO_DISBURSEMENT,
        },
      ],
    },
    educationProgram:
      PROGRAM_UNDERGRADUATE_CERTIFICATE_WITHOUT_INSTITUTION_PROGRAM_CODE,
    offering: OFFERING_2023_2024_SET_DEC_FULL_TIME,
  };
