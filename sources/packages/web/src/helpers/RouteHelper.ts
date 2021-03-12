import { AppRoutes } from "../types";
import { ClientIdType } from "../types/contracts/ConfigContract";

export class RouteHelper {
  static getRootRoute(clientType: ClientIdType): AppRoutes {
    switch (clientType) {
      case ClientIdType.STUDENT:
        return AppRoutes.StudentRoot;
      case ClientIdType.INSTITUTION:
        return AppRoutes.InstitutionRoot;
    }
  }

  static isRootRoute(path: string, clientType: ClientIdType) {
    const root = RouteHelper.getRootRoute(clientType);
    return path === root;
  }
}
