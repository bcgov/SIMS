import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  InstitutionLocationAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
  OptionItemAPIOutDTO,
  InstitutionUserAPIOutDTO,
  InstitutionUserAPIInDTO,
  UserActiveStatusAPIInDTO,
  InstitutionUserLocationsAPIOutDTO,
  ScholasticStandingDataAPIInDTO,
  InstitutionLocationPrimaryContactAPIInDTO,
  AESTInstitutionLocationAPIInDTO,
} from "@/services/http/dto";

export class InstitutionLocationApi extends HttpBaseClient {
  public async createInstitutionLocation(
    createInstitutionLocationDto: InstitutionLocationFormAPIInDTO,
  ): Promise<void> {
    return this.postCall<InstitutionLocationFormAPIInDTO>(
      this.addClientRoot("institution/location"),
      createInstitutionLocationDto,
    );
  }

  public async updateInstitutionLocation(
    locationId: number,
    updateInstitutionLocationDto:
      | InstitutionLocationPrimaryContactAPIInDTO
      | AESTInstitutionLocationAPIInDTO,
  ): Promise<void> {
    return this.patchCall<
      | InstitutionLocationPrimaryContactAPIInDTO
      | AESTInstitutionLocationAPIInDTO
    >(
      this.addClientRoot(`institution/location/${locationId}`),
      updateInstitutionLocationDto,
    );
  }

  public async getInstitutionLocation(
    locationId: number,
    institutionId?: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    const url = institutionId
      ? `institution/location/${locationId}/institution/${institutionId}/`
      : `institution/location/${locationId}`;
    return this.getCallTyped<InstitutionLocationFormAPIOutDTO>(
      this.addClientRoot(url),
    );
  }

  public async allInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    const url = institutionId
      ? `institution/location/${institutionId}`
      : "institution/location";
    return this.getCallTyped<InstitutionLocationAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }
  /**
   * This client expects custom error message in one or more
   * scenarios and hence trying to parse and throw the message
   * if available.
   * @param createInstitutionUserDto
   */
  public async createUser(
    createInstitutionUserDto: InstitutionUserAPIInDTO,
  ): Promise<void> {
    return this.postCall<InstitutionUserAPIInDTO>(
      this.addClientRoot("institution/user"),
      createInstitutionUserDto,
    );
  }

  public async getInstitutionLocationUserDetails(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.getCallTyped<InstitutionUserAPIOutDTO>(
      this.addClientRoot(`institution/user/${userName}`),
    );
  }

  /**
   * This client expects custom error message in one or more
   * scenarios and hence trying to parse and throw the message
   * if available.
   * @param updateInstitutionUserDto
   */
  public async updateUser(
    userName: string,
    updateInstitutionUserDto: InstitutionUserAPIInDTO,
  ): Promise<void> {
    return this.patchCall<InstitutionUserAPIInDTO>(
      this.addClientRoot(`institution/user/${userName}`),
      updateInstitutionUserDto,
    );
  }

  public async updateUserStatus(
    userName: string,
    userStatus: boolean,
  ): Promise<void> {
    return this.patchCall<UserActiveStatusAPIInDTO>(
      this.addClientRoot(`institution/user-status/${userName}`),
      {
        isActive: userStatus,
      },
    );
  }

  public async getMyInstitutionLocationsDetails(
    header?: any,
  ): Promise<InstitutionUserLocationsAPIOutDTO[]> {
    return this.getCallTyped<InstitutionUserLocationsAPIOutDTO[]>(
      this.addClientRoot("institution/my-locations"),
      header,
    );
  }

  public async getOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCallTyped<OptionItemAPIOutDTO[]>(
      this.addClientRoot("institution/location/options-list"),
    );
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return this.getCallTyped<ActiveApplicationDataAPIOutDTO>(
      this.addClientRoot(
        `institution/location/${locationId}/active-application/${applicationId}`,
      ),
    );
  }

  /**
   * Save scholastic standing and create new assessment.
   * @param applicationId application id
   * @param locationId location id
   * @param payload scholasticStanding payload
   */
  public async saveScholasticStanding(
    applicationId: number,
    locationId: number,
    payload: ScholasticStandingDataAPIInDTO,
  ): Promise<void> {
    try {
      await this.postCall(
        this.addClientRoot(
          `institution/location/${locationId}/application/${applicationId}/scholastic-standing`,
        ),
        { data: payload },
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }
}
