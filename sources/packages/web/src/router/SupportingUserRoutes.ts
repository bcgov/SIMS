import { RouteRecordRaw } from "vue-router";
import AppSupportingUsers from "@/views/supporting-user/AppSupportingUser.vue";
import Login from "@/views/supporting-user/Login.vue";
import Dashboard from "@/views/supporting-user/Dashboard.vue";
import SupportingInformation from "@/views/supporting-user/SupportingInformation.vue";
import {
  SupportingUserRoutesConst,
  SharedRouteConst,
} from "@/constants/routes/RouteConstants";
import { AppRoutes, AuthStatus, SupportingUserType } from "@/types";
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
        path: AppRoutes.SupportingUsersDashboard,
        name: SupportingUserRoutesConst.DASHBOARD,
        component: Dashboard,
        meta: {
          clientType: ClientIdType.SupportingUsers,
        },
      },
      {
        path: AppRoutes.ParentSupportingInfo,
        name: SupportingUserRoutesConst.PARENT_INFORMATION,
        component: SupportingInformation,
        props: {
          supportingUserType: SupportingUserType.Parent,
        },
        meta: {
          clientType: ClientIdType.SupportingUsers,
        },
      },
      {
        path: AppRoutes.PartnerSupportingInfo,
        name: SupportingUserRoutesConst.PARTNER_INFORMATION,
        component: SupportingInformation,
        props: {
          supportingUserType: SupportingUserType.Partner,
        },
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
                name: SupportingUserRoutesConst.DASHBOARD,
              });
              break;
            default:
              next({
                name: SharedRouteConst.FORBIDDEN_USER,
              });
          }
        })
        .catch((e) => {
          console.error(e);
          throw e;
        });
    },
  },
];
