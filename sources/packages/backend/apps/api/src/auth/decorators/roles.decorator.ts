import { SetMetadata } from "@nestjs/common";
import { ClientRole } from "../roles.enum";

export const ROLES_KEY = "roles";
export const Roles = (...roles: ClientRole[]) => SetMetadata(ROLES_KEY, roles);
