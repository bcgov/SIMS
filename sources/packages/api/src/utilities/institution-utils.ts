import { InstitutionUser } from "../database/entities";
import { InstitutionUserRespDto } from "../route-controllers/institution/models/institution.user.res.dto";

/**
 * Util to transform institution users to InstitutionUserRespDto.
 * @param Entity
 * @returns InstitutionUserRespDto
 */
export const transformToInstitutionUserRespDto = (
  institutionUser: InstitutionUser,
): InstitutionUserRespDto => {
  return {
    id: institutionUser.id,
    authorizations: institutionUser.authorizations.map((authorization) => ({
      id: authorization.id,
      authType: {
        role: authorization.authType?.role,
        type: authorization.authType?.type,
      },
      location: {
        name: authorization.location?.name,
      },
    })),
    user: {
      email: institutionUser.user.email,
      firstName: institutionUser.user.firstName,
      lastName: institutionUser.user.lastName,
      userName: institutionUser.user.userName,
      isActive: institutionUser.user.isActive,
    },
  } as InstitutionUserRespDto;
};
