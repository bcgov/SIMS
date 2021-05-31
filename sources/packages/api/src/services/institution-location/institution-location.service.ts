import { Injectable, Inject, UnprocessableEntityException } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection } from "typeorm";
import { UserInfo, ValidatedInstitutionLocation } from "../../types";
import { InstitutionService } from "..";
import { InstitutionLocationsDetailsDto } from "../../route-controllers/institution-locations/models/institution-location.dto";
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

  async createtLocation(institution_id: number, data: ValidatedInstitutionLocation): Promise<any> {
    const institution = { id: institution_id };
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

  async updateLocation(locationId: number, institution_id: number, data: ValidatedInstitutionLocation): Promise<any> {
    const institution = { id: institution_id };
    const updateLocation = {
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

    return await this.repo.update(locationId, updateLocation);
  }

  async getAllInstitutionlocations(institution_id: number): Promise<InstitutionLocationsDetailsDto[]> {
    return this.repo
      .createQueryBuilder("institution_location")
      .select(['institution_location.name', 'institution_location.data', 'institution.institutionPrimaryContact', 'institution_location.id'])
      .leftJoin("institution_location.institution", "institution")
      .where('institution.id = :Id', { Id: institution_id})
      .getMany();
  }

  async getInstitutionLocation(institution_id: number, location_id: number): Promise<InstitutionLocationsDetailsDto> {
    return this.repo
      .createQueryBuilder("institution_location")
      .select(['institution_location.name', 'institution_location.data', 'institution.institutionPrimaryContact', 'institution_location.id'])
      .leftJoin("institution_location.institution", "institution")
      .where('institution.id = :Id and institution_Location.id = :locationId', { Id: institution_id, locationId: location_id})
      .getOne();
  }

}
