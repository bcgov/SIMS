import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
  OptionItemAPIOutDTO,
  InstitutionUserAPIOutDTO,
  UserActiveStatusAPIInDTO,
  InstitutionUserLocationsAPIOutDTO,
  InstitutionLocationPrimaryContactAPIInDTO,
  InstitutionLocationAPIInDTO,
} from "@/services/http/dto";

export class InstitutionLocationApi extends HttpBaseClient {
  public async createInstitutionLocation(
    createInstitutionLocationDto: InstitutionLocationFormAPIInDTO,
  ): Promise<void> {
    await this.postCall<InstitutionLocationFormAPIInDTO>(
      this.addClientRoot("location"),
      createInstitutionLocationDto,
    );
  }

  public async updateInstitutionLocation(
    locationId: number,
    updateInstitutionLocationDto:
      | InstitutionLocationPrimaryContactAPIInDTO
      | InstitutionLocationAPIInDTO,
  ): Promise<void> {
    return this.patchCall<
      InstitutionLocationPrimaryContactAPIInDTO | InstitutionLocationAPIInDTO
    >(
      this.addClientRoot(`location/${locationId}`),
      updateInstitutionLocationDto,
    );
  }

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return this.getCallTyped<InstitutionLocationFormAPIOutDTO>(
      this.addClientRoot(`location/${locationId}`),
    );
  }

  public async getInstitutionLocationUserDetails(
    userName: string,
  ): Promise<InstitutionUserAPIOutDTO> {
    return this.getCallTyped<InstitutionUserAPIOutDTO>(
      this.addClientRoot(`institution/user/${userName}`),
    );
  }

  public async updateUserStatus(
    userName: string,
    userStatus: boolean,
  ): Promise<void> {
    try {
      await this.patchCall<UserActiveStatusAPIInDTO>(
        this.addClientRoot(`institution/user-status/${userName}`),
        {
          isActive: userStatus,
        },
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
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
      this.addClientRoot("location/options-list"),
    );
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return this.getCallTyped<ActiveApplicationDataAPIOutDTO>(
      this.addClientRoot(
        `location/${locationId}/active-application/${applicationId}`,
      ),
    );
  }
}
