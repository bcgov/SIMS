import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection, SelectQueryBuilder, UpdateResult } from "typeorm";
import { ValidatedInstitutionLocation } from "../../types";
import { InstitutionLocationModel } from "./institution-location.models";
import { DesignationAgreementLocationService } from "../designation-agreement/designation-agreement-locations.service";
import { LocationWithDesignationStatus } from "./institution-location.models";
@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(
    connection: Connection,
    private readonly designationAgreementLocationService: DesignationAgreementLocationService,
  ) {
    super(connection.getRepository(InstitutionLocation));
  }

  async getInstitutionLocationById(id: number): Promise<InstitutionLocation> {
    return this.repo
      .createQueryBuilder("institution_location")
      .select([
        "institution_location.name",
        "institution_location.data",
        "institution_location.id",
        "institution.id",
      ])
      .leftJoin("institution_location.institution", "institution")
      .where("institution_location.id = :id", { id })
      .getOneOrFail();
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
          addressLine1: data.data.addressLine1,
          addressLine2: data.data.addressLine2,
          province: data.data.provinceState,
          country: data.data.country,
          city: data.data.city,
          postalCode: data.data.postalCode,
        },
      },
      primaryContact: {
        firstName: data.data.primaryContactFirstName,
        lastName: data.data.primaryContactLastName,
        email: data.data.primaryContactEmail,
        phoneNumber: data.data.primaryContactPhone,
      },
      institution: institution,
      institutionCode: data.data.institutionCode,
    };

    return await this.repo.save(newLocation);
  }

  async updateLocation(
    locationId: number,
    institutionId: number,
    data: InstitutionLocationModel,
  ): Promise<UpdateResult> {
    const institution = { id: institutionId };
    const updateLocation = {
      name: data.locationName,
      data: {
        address: {
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          province: data.provinceState,
          country: data.country,
          city: data.city,
          postalCode: data.postalCode,
        },
      },
      primaryContact: {
        firstName: data.primaryContactFirstName,
        lastName: data.primaryContactLastName,
        email: data.primaryContactEmail,
        phoneNumber: data.primaryContactPhone,
      },
      institution: institution,
      institutionCode: data.institutionCode,
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
        "institution_location.primaryContact",
        "institution_location.institutionCode",
      ])
      .leftJoin("institution_location.institution", "institution")
      .where("institution.id = :id", { id: institutionId })
      .getMany();
  }

  /**
   * Gets all locations available and return just
   * a subset of available data.
   * @returns all locations.
   */
  async getDesignatedLocations(): Promise<Partial<InstitutionLocation>[]> {
    return this.repo
      .createQueryBuilder("location")
      .select("location.id")
      .addSelect("location.name")
      .orderBy("location.name")
      .andWhere(
        `EXISTS(${this.designationAgreementLocationService
          .getExistsDesignatedLocation()
          .getSql()})`,
      )
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
        "institution_location.institutionCode",
        "institution_location.primaryContact",
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

  /**
   * Gets all locations ids for a particular institution.
   * This method is used during the login process and should be
   * as lightweight as possible. Do not expand this query unless
   * it is related to login/authorization process.
   * @param institutionId institution id.
   * @returns institution locations ids.
   */
  async getInstitutionLocationsIds(institutionId: number): Promise<number[]> {
    const allLocations = await this.repo
      .createQueryBuilder("locations")
      .select("locations.id")
      .leftJoin("locations.institution", "institutions")
      .where("institutions.id = :institutionId", { institutionId })
      .getMany();

    return allLocations.map((location) => location.id);
  }

  /**
   * Validate if all the supplied locationIds
   * in a payload belongs to the given institution.
   * @param institutionId
   * @param locations
   * @returns result which has true when incorrect location id(s) are given.
   */
  async validateInstitutionLocations(
    institutionId: number,
    locations: number[],
  ): Promise<boolean> {
    const found = await this.repo
      .createQueryBuilder("location")
      .select("1")
      .where("location.institution.id = :institutionId", { institutionId })
      .andWhere("location.id IN (:...locations)", {
        locations: locations,
      })
      .getRawMany();
    return found.length === locations.length;
  }

  /**
   * Get institution location by location id.
   * @param locationId location id
   * @returns InstitutionLocation.
   */
  async getLocation(
    locationId: number,
  ): Promise<LocationWithDesignationStatus> {
    return this.buildLocationQuery(locationId, undefined).getRawOne();
  }

  /**
   * Get institution locations by institution id.
   * @param institutionId institutionId id
   * @returns InstitutionLocations.
   */
  async getLocations(
    institutionId: number,
  ): Promise<LocationWithDesignationStatus[]> {
    return this.buildLocationQuery(undefined, institutionId).getRawMany();
  }

  private buildLocationQuery(
    locationId?: number,
    institutionId?: number,
  ): SelectQueryBuilder<InstitutionLocation> {
    const query = this.repo
      .createQueryBuilder("location")
      .select("location.name", "locationName")
      .addSelect("location.info", "locationAddress")
      .addSelect("location.id", "id")
      .addSelect("location.institutionCode", "institutionCode")
      .addSelect("location.primaryContact", "primaryContact")
      .addSelect(
        `CASE
      WHEN EXISTS(${this.designationAgreementLocationService
        .getExistsDesignatedLocation()
        .getSql()}) THEN true
      ELSE false
    END`,
        "isDesignated",
      );
    if (locationId) {
      return query.where("location.id = :locationId", { locationId });
    }

    if (institutionId) {
      return query
        .innerJoin("location.institution", "institution")
        .where("institution.id = :id", {
          id: institutionId,
        });
    }
  }
}
