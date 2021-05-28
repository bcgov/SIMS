export interface Institutionlocation {
  address1: string;
  address2?: string;
  city: string;
  country: string;
  locationName: string;
  postalZipCode: string;
  provinceState: string;
}
export interface InstitutionlocationData {
  name: string;
  data: {
    address1: string;
    address2?: string;
    city: string;
    provinceState: string;
    postalZipCode: string;
    country: string;
  };
}
export interface InstitutionLocationsDetails {
  id:number,
  name: string;
  data: {
    address: {
      addressLine1: string;
      addressLine2?: string;
      province: string;
      country: string;
      city: string;
      postalCode: string;
    };
  };
  institution: {
    institutionPrimaryContact: {
      primaryContactEmail: string;
      primaryContactFirstName: string;
      primaryContactLastName: string;
      primaryContactPhone: string;
    };
  };
}
export interface InstitutionUserRoleLocation {
  locationId?: string;
  userType?: string;
}
export interface InstitutionUser {
  userId: string;
  userType?: string;
  location?: InstitutionUserRoleLocation[];
  userGuid?: string;
}

export interface InstitutionUserDto {
  userId: string;
  permissions: UserPermissionDto[];
}

export interface UserPermissionDto {
  locationId?: number;
  userType?: string;
  userRole?: string;
}

export interface InstitutionUserWithUserType {
  id?:number,
  name?: string;
  data?: {
    address: {
      addressLine1: string;
      addressLine2?: string;
      province: string;
      country: string;
      city: string;
      postalCode: string;
    };
  };
  institution?: {
    institutionPrimaryContact: {
      primaryContactEmail: string;
      primaryContactFirstName: string;
      primaryContactLastName: string;
      primaryContactPhone: string;
    };
  };
  userType?: {
    name?: string;
    code?: string;
  },

}