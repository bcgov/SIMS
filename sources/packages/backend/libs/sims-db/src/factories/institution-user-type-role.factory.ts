import { InstitutionUserRole, InstitutionUserType } from "../../types";
import { Repository } from "typeorm";
import { InstitutionUserTypeAndRole } from "../entities";

export async function institutionUserTypeAndRoleFactory(
  repo: Repository<InstitutionUserTypeAndRole>,
  options: { type: InstitutionUserType; role: InstitutionUserRole },
): Promise<InstitutionUserTypeAndRole> {
  return repo.findOneOrFail({
    where: { type: options.type, role: options.role },
  });
}
