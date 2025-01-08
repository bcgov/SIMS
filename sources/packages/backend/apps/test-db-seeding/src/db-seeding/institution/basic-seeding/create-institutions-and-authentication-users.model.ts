import { InstitutionUserRoles, InstitutionUserTypes } from "@sims/sims-db";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "@sims/sims-db/constant";
import {
  COLLEGE_C_BUSINESS_GUID,
  COLLEGE_D_BUSINESS_GUID,
  COLLEGE_E_BUSINESS_GUID,
  COLLEGE_F_BUSINESS_GUID,
  SIMS2_COLLC_USER,
  SIMS2_COLLD_USER,
  SIMS2_COLLE_USER,
  SIMS2_COLLF_USER,
  SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
  SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
  SIMS_COLLE_ADMIN_NON_LEGAL_SIGNING_USER,
  SIMS_COLLF_ADMIN_LEGAL_SIGNING_USER,
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
  institutionTypeId: number;
  users: InstitutionUserBaseData[];
}

export const INSTITUTIONS_INITIAL_DATA: InstitutionBaseData[] = [
  {
    legalOperatingName: "College C - Business BCeID",
    operatingName: "College C (non-legal operating name)",
    businessGuid: COLLEGE_C_BUSINESS_GUID,
    institutionTypeId: INSTITUTION_TYPE_BC_PRIVATE,
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
        lastName: "COLLC",
        userType: InstitutionUserTypes.user,
        userRole: undefined,
      },
    ],
  },
  {
    legalOperatingName: "College D - Business BCeID",
    operatingName: "College D (non-legal operating name)",
    businessGuid: COLLEGE_D_BUSINESS_GUID,
    institutionTypeId: INSTITUTION_TYPE_BC_PRIVATE,
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
  {
    legalOperatingName: "College E - Business BCeID",
    operatingName: "College E (non-legal operating name)",
    businessGuid: COLLEGE_E_BUSINESS_GUID,
    institutionTypeId: INSTITUTION_TYPE_BC_PUBLIC,
    users: [
      {
        userName: SIMS_COLLE_ADMIN_NON_LEGAL_SIGNING_USER,
        firstName: "SIMS",
        lastName: "COLLE",
        userType: InstitutionUserTypes.admin,
        userRole: undefined,
      },
      {
        userName: SIMS2_COLLE_USER,
        firstName: "SIMS2",
        lastName: "COLLE",
        userType: InstitutionUserTypes.readOnlyUser,
        userRole: undefined,
      },
    ],
  },
  {
    legalOperatingName: "College F - Business BCeID",
    operatingName: "College F (non-legal operating name)",
    businessGuid: COLLEGE_F_BUSINESS_GUID,
    institutionTypeId: INSTITUTION_TYPE_BC_PUBLIC,
    users: [
      {
        userName: SIMS_COLLF_ADMIN_LEGAL_SIGNING_USER,
        firstName: "SIMS",
        lastName: "COLLF",
        userType: InstitutionUserTypes.admin,
        userRole: InstitutionUserRoles.legalSigningAuthority,
      },
      {
        userName: SIMS2_COLLF_USER,
        firstName: "SIMS2",
        lastName: "COLLF",
        userType: InstitutionUserTypes.user,
        userRole: undefined,
      },
    ],
  },
];
