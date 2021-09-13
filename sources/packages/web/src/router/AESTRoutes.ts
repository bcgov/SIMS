import { RouteRecordRaw } from "vue-router";
import AppAEST from "../views/aest/AppAEST.vue";
import Login from "../views/aest/Login.vue";
import Home from "../views/aest/Home.vue";

import {
  AESTRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import { AppConfigService } from "../services/AppConfigService";
import { AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";

export const aestRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.AESTRoot,
    name: AESTRoutesConst.APP_AEST,
    component: AppAEST,
    children: [
      {
        path: AppRoutes.Login,
        name: AESTRoutesConst.LOGIN,
        component: Login,
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.AESTHome,
        name: AESTRoutesConst.HOME,
        component: Home,
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
    ],
    beforeEnter: (to, _from, next) => {
      AppConfigService.shared
        .initAuthService(ClientIdType.AEST)
        .then(() => {
          const status = RouteHelper.getNavigationAuthStatus(
            ClientIdType.AEST,
            to.path,
          );
          console.log(status);
          switch (status) {
            case AuthStatus.Continue:
              next();
              break;
            case AuthStatus.RequiredLogin:
              next({
                name: AESTRoutesConst.LOGIN,
              });
              break;
            case AuthStatus.RedirectHome:
              next({
                name: AESTRoutesConst.HOME,
              });
              break;
            case AuthStatus.ForbiddenUser:
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
              });
              break;
            default:
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
              });
          }
        })
        .catch(e => {
          console.error(e);
          throw e;
        });
    },
  },
];
