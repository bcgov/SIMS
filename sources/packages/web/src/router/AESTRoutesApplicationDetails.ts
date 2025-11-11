import { RouteLocationNormalizedGeneric, RouteRecordRaw } from "vue-router";
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

/**
 * AEST Routes for Application Details views.
 */
export const AESTRoutesApplicationDetails: Array<RouteRecordRaw> = [
  {
    path: getVersionRoutePath(AppRoutes.ApplicationView),
    name: AESTRoutesConst.APPLICATION_VERSION_DETAILS,
    props: (route) => ({
      ...defaultDetailsRoute(route),
    }),
    component: StudentApplicationView,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: getVersionRoutePath(AppRoutes.AssessmentSummary),
    name: AESTRoutesConst.ASSESSMENTS_SUMMARY_DETAILS_VERSION,
    props: (route) => ({
      ...defaultDetailsRoute(route),
    }),
    component: AssessmentsSummaryVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: getVersionRoutePath(AppRoutes.AssessmentAwardView),
    name: AESTRoutesConst.ASSESSMENT_AWARD_VIEW_VERSION,
    props: (route) => ({
      ...defaultDetailsRoute(route),
      assessmentId: Number.parseInt(route.params.assessmentId as string),
    }),
    component: AssessmentAwardVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: getVersionRoutePath(AppRoutes.NoticeOfAssessmentView),
    name: AESTRoutesConst.NOTICE_OF_ASSESSMENT_VIEW_VERSION,
    props: (route) => ({
      ...defaultDetailsRoute(route),
      assessmentId: Number.parseInt(route.params.assessmentId as string),
    }),
    component: NoticeOfAssessmentVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: getVersionRoutePath(AppRoutes.StudentAppealRequest),
    name: AESTRoutesConst.STUDENT_APPLICATION_APPEAL_REQUESTS_APPROVAL_VERSION,
    props: (route) => ({
      ...defaultDetailsRoute(route),
      appealId: Number.parseInt(route.params.appealId as string),
    }),
    component: StudentAppealRequestsApprovalVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
  {
    path: getVersionRoutePath(AppRoutes.ScholasticStandingView),
    name: AESTRoutesConst.SCHOLASTIC_STANDING_VIEW_VERSION,
    props: (route) => ({
      ...defaultDetailsRoute(route),
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
    path: getVersionRoutePath(
      AppRoutes.StudentApplicationOfferingChangeRequest,
    ),
    name: AESTRoutesConst.STUDENT_APPLICATION_OFFERING_CHANGE_REQUEST_VERSION,
    props: (route) => ({
      ...defaultDetailsRoute(route),
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
    path: getVersionRoutePath(AppRoutes.ApplicationException),
    name: AESTRoutesConst.APPLICATION_EXCEPTIONS_APPROVAL_VERSION,
    props: true,
    component: ApplicationExceptionsApprovalVersion,
    meta: {
      clientType: ClientIdType.AEST,
    },
  },
];

/**
 * Convert the default route params in applications details routes.
 * @param route route with the parameters to be converted.
 * @returns studentId, applicationId and versionApplicationId as numbers.
 */
function defaultDetailsRoute(route: RouteLocationNormalizedGeneric) {
  return {
    studentId: Number.parseInt(route.params.studentId as string),
    applicationId: Number.parseInt(route.params.applicationId as string),
    versionApplicationId: Number.parseInt(
      route.params.versionApplicationId as string,
    ),
  };
}

/**
 * Creates the version route path for application details routes.
 * @param baseRouteName base route name.
 * @returns version route path.
 */
function getVersionRoutePath(baseRouteName: string): string {
  return `version/:versionApplicationId/${baseRouteName}`;
}
