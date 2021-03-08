import { RouteRecordRaw } from "vue-router";
import InstitutionDashboard from "../views/institution/InstitutionDashboard.vue";
import AppInstitution from "../views/institution/AppInstitution.vue";

export const institutionRoutes: Array<RouteRecordRaw> = [
  {
    path: "/institution",
    name: "AppInstitution",
    component: AppInstitution,
    children: [
      {
        path: "institution-dashboard",
        name: "InstitutionDashboard",
        component: InstitutionDashboard,
      },
    ],
  },
];
