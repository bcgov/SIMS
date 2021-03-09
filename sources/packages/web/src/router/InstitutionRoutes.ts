import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import { InstitutionRoutesConst } from "../constants/routes/RouteConstants";

export const institutionRoutes: Array<RouteRecordRaw> = [
  {
    path: "/institution",
    name: InstitutionRoutesConst.APP_INSTITUTION,
    component: AppInstitution,
    children: [
      {
        path: "institution-dashboard",
        name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        component: InstitutionDashboard,
      },
    ],
  },
];
