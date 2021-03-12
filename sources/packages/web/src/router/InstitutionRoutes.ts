import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import InstitutionProfile from "../views/institution/InstitutionProfile.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";
import { InstitutionRoutesConst } from "../constants/routes/RouteConstants";
import Login from "../views/institution/Login.vue";

export const institutionRoutes: Array<RouteRecordRaw> = [
  {
    path: "/institution",
    name: InstitutionRoutesConst.APP_INSTITUTION,
    component: AppInstitution,
    children: [
      {
        path: "login",
        name: InstitutionRoutesConst.LOGIN,
        component: Login,
      },
      {
        path: "institution-dashboard",
        name: InstitutionRoutesConst.INSTITUTION_DASHBOARD,
        component: InstitutionDashboard,
      },
      {
        path: "institution-profile",
        name: InstitutionRoutesConst.INSTITUTION_PROFILE,
        component: InstitutionProfile,
      },
    ],
  },
];
