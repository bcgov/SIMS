import { ClientIdType } from "./contracts/ConfigContract";

export enum UserRoles {
  StudentUser = "StudentRole",
  InstitutionUser = "InstitutionAdmin",
}

export const ClientRolesMap: { [Value in ClientIdType]: UserRoles[] } = {
  [ClientIdType.STUDENT]: [UserRoles.StudentUser],
  [ClientIdType.INSTITUTION]: [UserRoles.InstitutionUser],
};
