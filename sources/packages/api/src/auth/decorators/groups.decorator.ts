import { SetMetadata } from "@nestjs/common";
import { UserGroups } from "../user-groups.enum";

export const GROUPS_KEY = "groups";
export const Groups = (...groups: UserGroups[]) =>
  SetMetadata(GROUPS_KEY, groups);
