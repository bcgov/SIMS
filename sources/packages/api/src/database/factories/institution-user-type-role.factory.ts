import { InstitutionUserRole, InstitutionUserType } from "src/types";
import { Repository } from "typeorm";
import { InstitutionUserTypeAndRole } from "../entities";

export async function institutionUserTypeAndRoleFactory(
  repo: Repository<InstitutionUserTypeAndRole>,
  options: { type: InstitutionUserType; role: InstitutionUserRole },
): Promise<InstitutionUserTypeAndRole> {
  return repo.findOneOrFail({
    type: options.type,
    role: options.role,
  });
}
