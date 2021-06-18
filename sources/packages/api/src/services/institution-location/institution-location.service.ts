import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection, UpdateResult } from "typeorm";
import { ValidatedInstitutionLocation } from "../../types";
import { InstitutionService } from "..";
import { InstitutionLocationTypeDto } from "../../route-controllers/institution-locations/models/institution-location.dto";
@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(
    @Inject("Connection") private readonly connection: Connection,
    private readonly institutionService: InstitutionService,
  ) {
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

  async createLocation(
    institution_id: number,
    data: ValidatedInstitutionLocation,
  ): Promise<any> {
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

  async updateLocation(
    locationId: number,
    institutionId: number,
    data: InstitutionLocationTypeDto,
  ): Promise<UpdateResult> {
    const institution = { id: institutionId };
    const updateLocation = {
      name: data.locationName,
      data: {
        address: {
          addressLine1: data.address1,
          addressLine2: data.address2,
          province: data.provinceState,
          country: data.country,
          city: data.city,
          postalCode: data.postalZipCode,
        },
      },
      institution: institution,
    };

    return await this.repo.update(locationId, updateLocation);
  }

  async getAllInstitutionLocations(
    institutionId: number,
  ): Promise<InstitutionLocation[]> {
    return this.repo
      .createQueryBuilder("institution_location")
      .select([
        "institution_location.name",
        "institution_location.data",
        "institution.institutionPrimaryContact",
        "institution_location.id",
      ])
      .leftJoin("institution_location.institution", "institution")
      .where("institution.id = :id", { id: institutionId })
      .getMany();
  }

  async getInstitutionLocation(
    institutionId: number,
    locationId: number,
  ): Promise<InstitutionLocation> {
    return this.repo
      .createQueryBuilder("institution_location")
      .select([
        "institution_location.name",
        "institution_location.data",
        "institution.institutionPrimaryContact",
        "institution_location.id",
      ])
      .leftJoin("institution_location.institution", "institution")
      .where("institution.id = :id and institution_Location.id = :locationId", {
        id: institutionId,
        locationId: locationId,
      })
      .getOne();
  }

  async getMyInstitutionLocations(
    locationIds: number[],
  ): Promise<InstitutionLocation[]> {
    return this.repo.findByIds(locationIds);
  }
}
