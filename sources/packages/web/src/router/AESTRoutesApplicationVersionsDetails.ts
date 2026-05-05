import { RouteRecordRaw } from "vue-router";
import { AESTRoutesConst } from "@/constants/routes/RouteConstants";
import { AppRoutes, ClientIdType } from "@/types";
import StudentApplicationView from "@/views/aest/student/applicationDetails/StudentApplicationView.vue";
import AssessmentsSummaryVersion from "@/views/aest/student/applicationDetails/AssessmentsSummaryVersion.vue";
import StudentAppealRequestsApprovalVersion from "@/views/aest/student/applicationDetails/StudentAppealRequestsApprovalVersion.vue";
import NoticeOfAssessmentVersion from "@/views/aest/student/applicationDetails/NoticeOfAssessmentVersion.vue";
import ViewScholasticStandingVersion from "@/views/aest/student/applicationDetails/ViewScholasticStandingVersion.vue";
import AssessmentAwardVersion from "@/views/aest/student/applicationDetails/AssessmentAwardVersion.vue";
import ApplicationOfferingChangeRequestForm from "@/views/aest/student/applicationDetails/ApplicationOfferingChangeRequestForm.vue";
import ApplicationExceptionsApprovalVersion from "@/views/aest/student/applicationDetails/ApplicationExceptionsApprovalVersion.vue";
import StudentFormSubmissionApproval from "@/views/aest/student/StudentFormSubmissionApproval.vue";
import { RouteHelper } from "@/helpers";

/**
 * AEST Routes for application version details views.
 */
export const AESTRoutesApplicationVersionsDetails: Array<RouteRecordRaw> = [
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.ApplicationView),
    name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
    }),
    component: StudentApplicationView,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.AssessmentSummary),
    name: AESTRoutesConst.ASSESSMENTS_SUMMARY_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
    }),
    component: AssessmentsSummaryVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.AssessmentAwardView),
    name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
      assessmentId: Number.parseInt(route.params.assessmentId as string),
    }),
    component: AssessmentAwardVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.NoticeOfAssessmentView),
    name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
      assessmentId: Number.parseInt(route.params.assessmentId as string),
    }),
    component: NoticeOfAssessmentVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.StudentAppealRequest),
    name: AESTRoutesConst.STUDENT_APPLICATION_APPEAL_REQUESTS_APPROVAL_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
      appealId: Number.parseInt(route.params.appealId as string),
    }),
    component: StudentAppealRequestsApprovalVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(
      AppRoutes.StudentFormSubmissionApproval,
    ),
    name: AESTRoutesConst.STUDENT_APPLICATION_FORM_SUBMISSION_APPROVAL_VERSION,
    props: (route) => ({
      formSubmissionId: Number.parseInt(
        route.params.formSubmissionId as string,
      ),
      backTarget: {
        name: "Assessments",
        to: {
          name: AESTRoutesConst.ASSESSMENTS_SUMMARY_VERSION,
          params: {
            studentId: route.params.studentId,
            applicationId: route.params.applicationId,
          },
        },
      },
    }),
    component: StudentFormSubmissionApproval,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.ScholasticStandingView),
    name: AESTRoutesConst.SCHOLASTIC_STANDING_VIEW_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
      scholasticStandingId: Number.parseInt(
        route.params.scholasticStandingId as string,
      ),
    }),
    component: ViewScholasticStandingVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(
      AppRoutes.StudentAESTApplicationOfferingChangeRequest,
    ),
    name: AESTRoutesConst.STUDENT_APPLICATION_OFFERING_CHANGE_REQUEST_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
      applicationOfferingChangeRequestId: Number.parseInt(
        route.params.applicationOfferingChangeRequestId as string,
      ),
    }),
    component: ApplicationOfferingChangeRequestForm,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: RouteHelper.getVersionRoutePath(AppRoutes.ApplicationException),
    name: AESTRoutesConst.APPLICATION_EXCEPTIONS_APPROVAL_VERSION,
    props: (route) => ({
      ...RouteHelper.defaultDetailsRoute(route),
      exceptionId: Number.parseInt(route.params.exceptionId as string),
    }),
    component: ApplicationExceptionsApprovalVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
];
