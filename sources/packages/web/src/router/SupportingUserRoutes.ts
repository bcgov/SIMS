import { RouteRecordRaw } from "vue-router";
import AppSupportingUsers from "@/views/supporting-user/AppSupportingUser.vue";
import Login from "@/views/supporting-user/Login.vue";
import Home from "@/views/supporting-user/Home.vue";
import ParentInformation from "@/views/supporting-user/ParentInformation.vue";
import PartnerInformation from "@/views/supporting-user/PartnerInformation.vue";
import {
  SupportingUserRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AppRoutes, AuthStatus } from "@/types";
import { ClientIdType } from "@/types/contracts/ConfigContract";
import { RouteHelper } from "@/helpers";
import { AuthService } from "@/services/AuthService";

export const supportingUsersRoutes: Array<RouteRecordRaw> = [
  {
    path: AppRoutes.SupportingUsersRoot,
    name: SupportingUserRoutesConst.APP_SUPPORTING_USERS,
    component: AppSupportingUsers,
    children: [
      {
        path: AppRoutes.Login,
        name: SupportingUserRoutesConst.LOGIN,
        component: Login,
        meta: {
          requiresAuth: false,
          clientType: ClientIdType.SupportingUsers,
        },
      },
      {
        path: AppRoutes.SupportingUsersHome,
        name: SupportingUserRoutesConst.HOME,
        component: Home,
        meta: {
          clientType: ClientIdType.SupportingUsers,
        },
      },
      {
        path: AppRoutes.ParentSupportingInfo,
        name: SupportingUserRoutesConst.PARENT_INFORMATION,
        component: ParentInformation,
        meta: {
          clientType: ClientIdType.SupportingUsers,
        },
      },
      {
        path: AppRoutes.PartnerSupportingInfo,
        name: SupportingUserRoutesConst.PARTNER_INFORMATION,
        component: PartnerInformation,
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
                name: SupportingUserRoutesConst.LOGIN,
              });
              break;
            case AuthStatus.RedirectHome:
              next({
                name: SupportingUserRoutesConst.HOME,
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
