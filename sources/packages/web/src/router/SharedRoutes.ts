import { SharedRouteConst } from "../constants/routes/RouteConstants";
import { RouteRecordRaw } from "vue-router";
import PageNotFound from "../views/PageNotFound.vue";
import ForbiddenUser from "../views/ForbiddenUser.vue";
import { AppRoutes, ClientIdType } from "../types";
import FormList from "../components/generic/FormList.vue";
import FormContainer from "../components/generic/FormContainer.vue";
import { AuthService } from "@/services/AuthService";

export const sharedRoutes: Array<RouteRecordRaw> = [
  {
    path: "/:pathMatch(.*)*",
    name: SharedRouteConst.PAGE_NOT_FOUND,
    component: PageNotFound,
  },
  {
    path: AppRoutes.ForbiddenUser,
    name: SharedRouteConst.FORBIDDEN_USER,
    component: ForbiddenUser,
  },
  {
    path: "/:pathMatch(.*)*/forms",
    name: "formsList",
    component: FormList,
    children: [
      {
        path: "load/:formName",
        name: "formContainer",
        component: FormContainer,
      },
    ],
    beforeEnter: (to, _from, next) => {
      const toPath = to.path;
      if (toPath.includes("student") || toPath.includes("institution")) {
        const type: ClientIdType = toPath.includes("student")
          ? ClientIdType.STUDENT
          : ClientIdType.INSTITUTION;
        AuthService.shared.initialize(type).then(() => {
          if (AuthService.shared.keycloak?.authenticated) {
            next();
          } else {
            next({
              name: SharedRouteConst.FORBIDDEN_USER,
            });
          }
        });
      } else {
        next({
          name: SharedRouteConst.PAGE_NOT_FOUND,
        });
      }
    },
  },
];
