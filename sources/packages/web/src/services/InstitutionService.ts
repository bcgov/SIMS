import { Institute } from "../types/contracts/InstituteContract";
import {
  InstitutionDto,
  EducationProgram,
  InstitutionDetailDto,
  InstitutionProfileState,
  UpdateInstitutionDto,
  InstitutionLocation,
  InstitutionLocationsDetails,
  InstitutionUserAuthDetails,
  InstitutionUserResDto,
  InstitutionUserViewModel,
  InstitutionUserDto,
  UserPermissionDto,
  InstitutionUserRoleLocation,
  UserAuth,
  InstitutionUserWithUserType,
  OptionItemDto,
} from "../types";
import ApiClient from "./http/ApiClient";
import { AppConfigService } from "./AppConfigService";

export class InstitutionService {
  // Share Instance
  private static instance: InstitutionService;

  public static get shared(): InstitutionService {
    return this.instance || (this.instance = new this());
  }

  public async getInstitutes(): Promise<Institute[]> {
    // TODO: Sending dummy list for now later replace with API call
    const institutes: Institute[] = [
      {
        name: "Sprott Shaw College",
        code: "ssc",
      },
    ];
    return institutes;
  }

  public async getProgramsFor(
    institute?: Institute,
  ): Promise<EducationProgram[]> {
    if (institute?.code === "ssc") {
      const programs: EducationProgram[] = [
        {
          name: "Nursing Program",
          code: "np",
        },
      ];
      return programs;
    }
    return [];
  }

  public async createInstitution(institutionProfile: InstitutionProfileState) {
    const institutionDto: InstitutionDto = {
      operatingName: institutionProfile.operatingName,
      primaryPhone: institutionProfile.primaryPhoneNumber,
      primaryEmail: institutionProfile.primaryEmail,
      website: institutionProfile.institutionWebsite,
      regulatingBody: institutionProfile.regulatingBody,
      establishedDate: institutionProfile.establishedDate,
      // Primary Contact
      primaryContactFirstName: institutionProfile.primaryContact.firstName,
      primaryContactLastName: institutionProfile.primaryContact.lastName,
      primaryContactEmail: institutionProfile.primaryContact.email,
      primaryContactPhone: institutionProfile.primaryContact.phoneNumber,
      // Legal Authority Contact
      legalAuthorityFirstName: institutionProfile.legalContact.firstName,
      legalAuthorityLastName: institutionProfile.legalContact.lastName,
      legalAuthorityEmail: institutionProfile.legalContact.email,
      legalAuthorityPhone: institutionProfile.legalContact.phoneNumber,
      // Primary address
      addressLine1: institutionProfile.primaryAddress.address1,
      addressLine2: institutionProfile.primaryAddress.address2,
      city: institutionProfile.primaryAddress.city,
      provinceState: institutionProfile.primaryAddress.provinceState,
      country: institutionProfile.primaryAddress.coutry,
      postalCode: institutionProfile.primaryAddress.postalCode,
    };
    await ApiClient.Institution.createInstitution(institutionDto);
  }

  public async createInstitutionV2(data: InstitutionDto) {
    await ApiClient.Institution.createInstitution(data);
  }

  public async updateInstitute(data: UpdateInstitutionDto) {
    await ApiClient.Institution.updateInstitution(data);
  }

  public async getDetail(): Promise<InstitutionDetailDto> {
    return ApiClient.Institution.getDetail();
  }

  public async sync() {
    return ApiClient.Institution.sync();
  }

  public async createInstitutionLocation(data: InstitutionLocation) {
    await ApiClient.InstitutionLocation.createInstitutionLocation(data);
  }

  public async updateInstitutionLocation(
    locationId: number,
    institutionLocation: InstitutionLocation,
  ) {
    await ApiClient.InstitutionLocation.updateInstitutionLocation(
      locationId,
      institutionLocation,
    );
  }

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationsDetails> {
    return await ApiClient.InstitutionLocation.getInstitutionLocation(
      locationId,
    );
  }

  public async getAllInstitutionLocations() {
    return await ApiClient.InstitutionLocation.allInstitutionLocationsApi();
  }

  public async users(): Promise<InstitutionUserViewModel[]> {
    const response: InstitutionUserResDto[] = await ApiClient.Institution.getUsers();
    const viewModels: InstitutionUserViewModel[] = response.map(
      institutionUser => {
        const roleArray = institutionUser.authorizations
          .map(auth => auth.authType.role || "")
          .filter(role => role !== "");
        const role = roleArray.length > 0 ? roleArray.join(" ") : "-";
        const locationArray = institutionUser.authorizations
          .map(auth => auth.location?.name || "")
          .filter(loc => loc !== "");
        const userType = institutionUser.authorizations
          .map(auth => auth.authType.type)
          .join(" ");
        const location = userType.toLowerCase().includes("admin")
          ? "All"
          : locationArray.length > 0
          ? locationArray.join(" ")
          : "";

        const viewModel: InstitutionUserViewModel = {
          id: institutionUser.id,
          displayName: `${institutionUser.user.firstName} ${institutionUser.user.lastName}`,
          email: institutionUser.user.email,
          userName: institutionUser.user.userName,
          userType,
          role,
          location,
          isActive: institutionUser.user.isActive,
          disableRemove:
            AppConfigService.shared.userToken?.userName ===
            institutionUser.user.userName
              ? true
              : false,
        };
        return viewModel;
      },
    );
    return viewModels;
  }

  async removeUser(id: number) {
    return ApiClient.Institution.removeUser(id);
  }

  public async getUserTypeAndRoles() {
    return ApiClient.Institution.getUserTypeAndRoles();
  }

  private async prepareUserPayload(
    isNew: boolean,
    data: InstitutionUserAuthDetails,
  ) {
    const payload = {} as InstitutionUserDto;
    if (isNew) {
      payload.userId = data.userId;
    }

    if (data.location) {
      // Add locations specific permissions.
      payload.permissions = data.location.map(
        (permission: InstitutionUserRoleLocation) =>
          ({
            userType: permission.userType,
            locationId: permission.locationId,
          } as UserPermissionDto),
      );
    } else {
      // Add institution specific permissions.
      payload.permissions = [
        {
          userType: data.userType,
        },
      ];
    }
    return payload;
  }

  public async createUser(data: InstitutionUserAuthDetails): Promise<void> {
    const payload = await this.prepareUserPayload(true, data);
    await ApiClient.InstitutionLocation.createUser(payload);
  }

  public async getInstitutionLocationUserDetails(userName: string) {
    return ApiClient.InstitutionLocation.getInstitutionLocationUserDetails(
      userName,
    );
  }

  public async updateUser(
    userName: string,
    data: InstitutionUserAuthDetails,
  ): Promise<void> {
    const payload = await this.prepareUserPayload(false, data);
    await ApiClient.InstitutionLocation.updateUser(userName, payload);
  }

  public async updateUserStatus(userName: string, userStatus: boolean) {
    return ApiClient.InstitutionLocation.updateUserStatus(userName, userStatus);
  }

  public async prepareAddUserPayload(
    isAdmin: boolean,
    selectUser: UserAuth,
    institutionLocationList: InstitutionLocationsDetails[],
  ) {
    return {
      userId: selectUser.code,
      userType: isAdmin ? "admin" : undefined,
      userGuid: selectUser.id,
      location: !isAdmin
        ? (institutionLocationList
            .map((el: InstitutionUserWithUserType) => {
              if (el.userType?.code) {
                return {
                  locationId: el.id,
                  userType: el.userType?.code,
                };
              }
            })
            .filter((el: any) => el) as InstitutionUserRoleLocation[])
        : undefined,
    } as InstitutionUserAuthDetails;
  }

  public async prepareEditUserPayload(
    institutionUserName: string,
    isAdmin: boolean,
    institutionLocationList: InstitutionUserWithUserType[],
  ) {
    return {
      userGuid: institutionUserName ? institutionUserName : undefined,
      userType: isAdmin ? "admin" : undefined,
      location: !isAdmin
        ? (institutionLocationList
            .map((el: InstitutionUserWithUserType) => {
              if (el.userType?.code) {
                return {
                  locationId: el?.id,
                  userType: el.userType?.code,
                };
              }
            })
            .filter((el: any) => el) as InstitutionUserRoleLocation[])
        : undefined,
    } as InstitutionUserAuthDetails;
  }

  public async getMyInstitutionDetails(authHeader?: any) {
    return ApiClient.Institution.getMyInstitutionDetails(authHeader);
  }

  public async getMyInstitutionLocationsDetails(authHeader?: any) {
    return ApiClient.InstitutionLocation.getMyInstitutionLocationsDetails(
      authHeader,
    );
  }

  public async getLocationsOptionsList(): Promise<OptionItemDto[]> {
    return ApiClient.InstitutionLocation.getOptionsList();
  }
}
