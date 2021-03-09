import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import { institutionRoutesConst } from "../constants/routes/RouteConstants";

export const institutionRoutes: Array<RouteRecordRaw> = [
  {
    path: "/institution",
    name: institutionRoutesConst.APP_INSTITUTION,
    component: AppInstitution,
    children: [
      {
        path: "institution-dashboard",
        name: institutionRoutesConst.INSTITUTION_DASHBOARD,
        component: InstitutionDashboard,
      },
    ],
  },
];
