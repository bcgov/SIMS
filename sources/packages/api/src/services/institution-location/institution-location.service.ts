import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection } from "typeorm";
import { UserInfo, ValidatedInstitutionLocation } from "../../types";
import { InstitutionService } from "..";


@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(@Inject("Connection") private readonly connection: Connection,
  private readonly institutionService: InstitutionService,) {
    super(connection.getRepository(InstitutionLocation));
  }

  /**
   * Get the institution location by ID.
   * TODO: Add restriction to the database query to ensure that the
   * the user requesting the information has access to it.
   * @param id Location id.
   * @returns Location retrieved, if found, otherwise returns null.
   */
  async getById(id: number): Promise<InstitutionLocation> {
    return await this.repo.findOne(id);
  }

  async createtLocation(userInfo: UserInfo, data: ValidatedInstitutionLocation): Promise<any> {
    //To retrive institution id
    const institutionDetails = await this.institutionService.getInstituteByUserName(
      userInfo.userName,
    );
    if (!institutionDetails) {
      throw new Error(
        "Not able to find a institution associated with the current user name.",
      );
    }
    const institution = { id: institutionDetails.id };
    const newLocation = {
      name: data.data.locationName,
      data: {
        address: {
          addressLine1: data.data.address1,
          addressLine2: data.data.address2,
          province: data.data.provinceState,
          country: data.data.country,
          city: data.data.city,
          postalCode: data.data.postalZipCode,
        },
      },
      institution: institution,
    };

    return await this.repo.save(newLocation);
  }

  async getAllInstitutionlocations(userInfo: UserInfo): Promise<any> {
    //To retrive institution id
    const institutionDetails = await this.institutionService.getInstituteByUserName(
      userInfo.userName,
    );
    if (!institutionDetails) {
      throw new Error(
        "Not able to find a institution associated with the current user name.",
      );
    }
    return this.repo
      .createQueryBuilder("institution_location")
      .select(['institution_location.name', 'institution_location.data', 'institution.institutionPrimaryContact'])
      .leftJoin("institution_location.institution", "institution", "institution.id = institution_location.institution_id")
      .where('institution.id = :Id', { Id: institutionDetails.id})
      .getMany();
  }
}
