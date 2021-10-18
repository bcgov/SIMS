import { RouteRecordRaw } from "vue-router";
import AppAEST from "@/views/aest/AppAEST.vue";
import Login from "@/views/aest/Login.vue";
import AESTDashboard from "@/views/aest/AESTDashboard.vue";
import AESTHomeSideBar from "@/components/layouts/aest/AESTHomeSideBar.vue";
import {
  AESTRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AppRoutes, AuthStatus } from "@/types";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";

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
        path: AppRoutes.NotAllowedUser,
        name: AESTRoutesConst.LOGIN_WITH_NOT_ALLOWED_USER,
        component: Login,
        props: {
          showNotAllowedUser: true,
        },
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.AEST,
        },
      },
      {
        path: AppRoutes.AESTDashboard,
        name: AESTRoutesConst.AEST_DASHBOARD,
        components: {
          default: AESTDashboard,
          sidebar: AESTHomeSideBar,
        },
        meta: {
          clientType: ClientIdType.AEST,
        },
      },
    ],
    beforeEnter: (to, _from, next) => {
      AuthService.shared
        .initialize(ClientIdType.AEST)
        .then(() => {
          const status = RouteHelper.getNavigationAuthStatus(
            ClientIdType.AEST,
            to.path,
          );
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
                name: AESTRoutesConst.AEST_DASHBOARD,
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
