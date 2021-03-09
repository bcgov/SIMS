import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import { routeConstants } from "../constants/routes/RouteConstants";

export const institutionRoutes: Array<RouteRecordRaw> = [
  {
    path: "/institution",
    name: routeConstants.APPINSTITUTION,
    component: AppInstitution,
    children: [
      {
        path: "institution-dashboard",
        name: routeConstants.INSTITUTIONDASHBOARD,
        component: InstitutionDashboard,
      },
    ],
  },
];
