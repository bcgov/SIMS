import { RouteRecordRaw } from "vue-router";
import AppSupportingUsers from "../views/supporting-users/AppSupportingUsers.vue";
import Login from "../views/supporting-users/Login.vue";
import Home from "../views/supporting-users/Home.vue";
import {
  SupportingUsersRoutesConst,
  SharedRouteConst,
} from "../constants/routes/RouteConstants";
import { AppRoutes, AuthStatus } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";

export const supportingUsersRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.SupportingUsersRoot,
    name: SupportingUsersRoutesConst.APP_SUPPORTING_USERS,
    component: AppSupportingUsers,
    children: [
      {
        path: AppRoutes.Login,
        name: SupportingUsersRoutesConst.LOGIN,
        component: Login,
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.SupportingUsers,
        },
      },
      {
        path: AppRoutes.SupportingUsersHome,
        name: SupportingUsersRoutesConst.HOME,
        component: Home,
        meta: {
          clientType: ClientIdType.SupportingUsers,
        },
      },
    ],
    beforeEnter: (to, _from, next) => {
      AuthService.shared
        .initialize(ClientIdType.SupportingUsers)
        .then(() => {
          const status = RouteHelper.getNavigationAuthStatus(
            ClientIdType.SupportingUsers,
            to.path,
          );
          switch (status) {
            case AuthStatus.Continue:
              next();
              break;
            case AuthStatus.RequiredLogin:
              next({
                name: SupportingUsersRoutesConst.LOGIN,
              });
              break;
            case AuthStatus.RedirectHome:
              next({
                name: SupportingUsersRoutesConst.HOME,
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
