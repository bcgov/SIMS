import { OfferingIntensity } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
  OptionItemAPIOutDTO,
  InstitutionLocationPrimaryContactAPIInDTO,
  InstitutionLocationAPIInDTO,
  InstitutionLocationsAPIOutDTO,
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
    return this.getCall<InstitutionLocationFormAPIOutDTO>(
      this.addClientRoot(`location/${locationId}`),
    );
  }

  public async getOptionsList(
    offeringIntensity?: OfferingIntensity,
  ): Promise<OptionItemAPIOutDTO[]> {
    let url = "location/options-list";
    if (offeringIntensity) {
      url = `${url}?offeringIntensity=${offeringIntensity}`;
    }
    return this.getCall<OptionItemAPIOutDTO[]>(this.addClientRoot(url));
  }

  public async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return this.getCall<ActiveApplicationDataAPIOutDTO>(
      this.addClientRoot(
        `location/${locationId}/active-application/${applicationId}`,
      ),
    );
  }

  /**
   * Get location details of logged in user.
   * @returns location details.
   */
  async getMyInstitutionLocationsDetails(): Promise<
    InstitutionLocationsAPIOutDTO[]
  > {
    return this.getCall<InstitutionLocationsAPIOutDTO[]>(
      this.addClientRoot("location"),
    );
  }
}
