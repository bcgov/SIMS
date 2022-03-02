import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import {
  DesignationAgreement,
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  User,
} from "../../database/entities";
import {
  UpdateDesignationDto,
  UpdateDesignationLocationDto,
} from "../../route-controllers/designation-agreement/models/designation-agreement.model";

/**
 * Manages the operations needed for designation agreements that are submitted by the institutions
 * and then need to be reviewed by the Ministry for approval or denial. While the Ministry is
 * approving the designation it can also edit dates and locations as needed.
 */
@Injectable()
export class DesignationAgreementService extends RecordDataModelService<DesignationAgreement> {
  constructor(connection: Connection) {
    super(connection.getRepository(DesignationAgreement));
  }

  /**
   * Initiates a new designation agreement request. This action
   * is meant to me initiated by the institution signing officer
   * for further assessment of the Ministry.
   * The designation agreement and the location that are part of it will
   * be saved as part of the same DB transaction.
   * @param institutionId institution id requesting the designation.
   * @param submittedData dynamic data that represents the designation requested.
   * @param submittedByUserId institution user submitting the designation.
   * @param submittedDate date that the institution user submitted the designation.
   * @param requestedLocationsIds ids of the locations requested to be designated.
   * @returns the new designation agreement created.
   */
  async submitDesignationAgreement(
    institutionId: number,
    submittedData: any,
    submittedByUserId: number,
    submittedDate: Date,
    requestedLocationsIds: number[],
  ): Promise<DesignationAgreement> {
    const submittedByUser = { id: submittedByUserId } as User;
    const newDesignation = new DesignationAgreement();
    newDesignation.institution = { id: institutionId } as Institution;
    newDesignation.submittedData = submittedData;
    newDesignation.designationStatus = DesignationAgreementStatus.Pending;
    newDesignation.submittedBy = submittedByUser;
    newDesignation.submittedDate = submittedDate;
    newDesignation.creator = submittedByUser;
    newDesignation.designationAgreementLocations = requestedLocationsIds.map(
      (locationId: number) => {
        const newLocation = new DesignationAgreementLocation();
        newLocation.institutionLocation = {
          id: locationId,
        } as InstitutionLocation;
        newLocation.requested = true;
        newLocation.creator = submittedByUser;
        return newLocation;
      },
    );
    return this.repo.save(newDesignation);
  }

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param designationId designation id.
   * @param institutionId institution id.
   * This value is passed only for client type Institution.
   * @returns designation agreement information.
   */
  async getInstitutionDesignationById(
    designationId: number,
    institutionId?: number,
  ): Promise<DesignationAgreement> {
    const designationQuery = this.repo
      .createQueryBuilder("designation")
      .select([
        "designation.id",
        "designation.designationStatus",
        "designation.submittedData",
        "designationLocation.id",
        "designationLocation.requested",
        "designationLocation.approved",
        "location.id",
        "location.name",
        "location.data",
        "institution.legalOperatingName",
        "institutionType.id",
        "institutionType.name",
      ])
      .innerJoin(
        "designation.designationAgreementLocations",
        "designationLocation",
      )
      .innerJoin("designationLocation.institutionLocation", "location")
      .innerJoin("designation.institution", "institution")
      .innerJoin("institution.institutionType", "institutionType")
      .where("designation.id = :designationId", { designationId });
    if (institutionId) {
      designationQuery.andWhere("location.institution.id = :institutionId", {
        institutionId,
      });
    }

    return designationQuery.getOne();
  }

  /**
   * Get the summary of all designation agreements for the institution.
   * @param institutionId institution to retrieve the designations.
   * @returns designations under the institution.
   */
  async getInstitutionDesignationsById(
    institutionId: number,
  ): Promise<DesignationAgreement[]> {
    return this.getDesignationSummaryByFilter("institution.id", institutionId);
  }

  /**
   * Service to get all pending designations.
   * @returns designation summary.
   */
  async getAllPendingDesignations(
    designationStatus: DesignationAgreementStatus,
  ): Promise<DesignationAgreement[]> {
    return this.getDesignationSummaryByFilter(
      "designation.designationStatus",
      designationStatus,
    );
  }

  /**
   * Verify when the institution already have a pending designation
   * agreement. Institutions are not supposed to have more than one
   * pending designation at the same time.
   * @param institutionId institution to be verified.
   * @returns true, if there is already a pending designation agreement.
   */
  async hasPendingDesignation(institutionId: number): Promise<boolean> {
    const found = await this.repo
      .createQueryBuilder("designation")
      .select("1")
      .where("designation.institution.id = :institutionId", { institutionId })
      .andWhere("designation.designationStatus = :designationStatus", {
        designationStatus: DesignationAgreementStatus.Pending,
      })
      .limit(1)
      .getRawOne();
    return !!found;
  }

  /**
   * Service to validate designationId passed onto API.
   * @param designationId
   * @returns flag that indicates if the designationId is valid data.
   */
  async designationExist(designationId: number): Promise<boolean> {
    const found = await this.repo
      .createQueryBuilder("designation")
      .select("1")
      .where("designation.id = :designationId", { designationId })
      .getRawOne();
    return !!found;
  }

  /**
   * Update designation for Approval/Denial or re-approve.
   * @param designationId Designation which is going to be updated.
   * @param userId User who updates the designation.
   * @param designationPayload update payload.
   */
  async updateDesignation(
    designationId: number,
    userId: number,
    designationPayload: UpdateDesignationDto,
  ): Promise<void> {
    const designation = new DesignationAgreement();
    designation.id = designationId;
    designation.designationStatus = designationPayload.designationStatus;
    designation.startDate = designationPayload.startDate;
    designation.endDate = designationPayload.endDate;
    designation.assessedBy = { id: userId } as User;
    designation.assessedDate = new Date();
    designation.designationAgreementLocations =
      designationPayload.locationsDesignations?.map(
        (locationPayload: UpdateDesignationLocationDto) => {
          const location = new DesignationAgreementLocation();
          location.id = locationPayload.designationLocationId;
          location.approved = true;
          location.institutionLocation = {
            id: locationPayload.locationId,
          } as InstitutionLocation;
          location.requested = true;
          location.creator = !locationPayload.designationLocationId
            ? ({ id: userId } as User)
            : undefined;
          location.modifier = { id: userId } as User;
          return location;
        },
      );
    this.repo.save(designation);
  }
  /**
   * Private service method that retrieves designation summary
   * based on the given filter.
   * @param filterColumn
   * @param filterValue
   * @returns designation summary.
   */
  private async getDesignationSummaryByFilter(
    filterColumn: string,
    filterValue: number | string,
  ): Promise<DesignationAgreement[]> {
    return this.repo
      .createQueryBuilder("designation")
      .select([
        "designation.id",
        "designation.designationStatus",
        "designation.submittedDate",
        "designation.startDate",
        "designation.endDate",
        "institution.legalOperatingName",
      ])
      .innerJoin("designation.institution", "institution")
      .where(`${filterColumn} = :filterValue`, { filterValue })
      .orderBy("designation.designationStatus", "ASC")
      .addOrderBy("designation.submittedDate", "DESC")
      .getMany();
  }
}
