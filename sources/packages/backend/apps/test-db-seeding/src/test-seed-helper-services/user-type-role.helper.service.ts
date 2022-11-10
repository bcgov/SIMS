import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InstitutionUserTypeAndRole } from "@sims/sims-db";
import {
  InstitutionUserRoles,
  InstitutionUserTypes,
} from "@sims/sims-db/entities/user-types.enum";
import { IsNull, Repository } from "typeorm";

@Injectable()
export class UserTypeRoleHelperService {
  constructor(
    @InjectRepository(InstitutionUserTypeAndRole)
    private institutionUserTypeAndRoleRepo: Repository<InstitutionUserTypeAndRole>,
  ) {}

  /**
   * Method to get the institution user type and role.
   * @param type institution user type.
   * @param role institution role type.
   * @returns institution user type and role.
   */
  async getInstitutionUserTypeAndRole(
    type: InstitutionUserTypes,
    role: InstitutionUserRoles,
  ): Promise<InstitutionUserTypeAndRole> {
    return this.institutionUserTypeAndRoleRepo.findOne({
      where: {
        role: role ?? IsNull(),
        type: type,
        active: true,
      },
    });
  }
}
