import { InstitutionUserRoles, InstitutionUserTypes } from "@sims/sims-db";
import {
  COLLEGE_C_BUSINESS_GUID,
  COLLEGE_D_BUSINESS_GUID,
  SIMS2_COLLC_USER,
  SIMS2_COLLD_USER,
  SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
  SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
} from "@sims/test-utils/constants";

export interface InstitutionUserBaseData {
  userName: string;
  firstName: string;
  lastName: string;
  userType: InstitutionUserTypes;
  userRole: InstitutionUserRoles;
}

export interface InstitutionBaseData {
  legalOperatingName: string;
  operatingName: string;
  businessGuid: string;
  users: InstitutionUserBaseData[];
}

export const INSTITUTIONS_INITIAL_DATA: InstitutionBaseData[] = [
  {
    legalOperatingName: "College C - Business BCeID",
    operatingName: "College C (non-legal operating name)",
    businessGuid: COLLEGE_C_BUSINESS_GUID,
    users: [
      {
        userName: SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
        firstName: "SIMS",
        lastName: "COLLC",
        userType: InstitutionUserTypes.admin,
        userRole: InstitutionUserRoles.legalSigningAuthority,
      },
      {
        userName: SIMS2_COLLC_USER,
        firstName: "SIMS2",
        lastName: "SIMS2",
        userType: InstitutionUserTypes.user,
        userRole: undefined,
      },
    ],
  },
  {
    legalOperatingName: "College D - Business BCeID",
    operatingName: "College D (non-legal operating name)",
    businessGuid: COLLEGE_D_BUSINESS_GUID,
    users: [
      {
        userName: SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
        firstName: "SIMS",
        lastName: "COLLD",
        userType: InstitutionUserTypes.admin,
        userRole: undefined,
      },
      {
        userName: SIMS2_COLLD_USER,
        firstName: "SIMS2",
        lastName: "COLLD",
        userType: InstitutionUserTypes.user,
        userRole: undefined,
      },
    ],
  },
];
