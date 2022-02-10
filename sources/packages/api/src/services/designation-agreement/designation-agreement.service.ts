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
import { SortPriority } from "../../utilities";

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
   * @returns designation agreement information.
   */
  async getInstitutionDesignationById(
    designationId: number,
    institutionId: number,
  ): Promise<DesignationAgreement> {
    return this.repo
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
      ])
      .innerJoin(
        "designation.designationAgreementLocations",
        "designationLocation",
      )
      .innerJoin("designationLocation.institutionLocation", "location")
      .where("designation.id = :designationId", { designationId })
      .andWhere("location.institution.id = :institutionId", { institutionId })
      .getOne();
  }

  /**
   * Get the summary of all designation agreements for the institution.
   * @param institutionId institution to retrieve the designations.
   * @returns designations under the institution.
   */
  async getInstitutionDesignationsById(
    institutionId: number,
  ): Promise<DesignationAgreement[]> {
    return this.repo
      .createQueryBuilder("designation")
      .select([
        "designation.id",
        "designation.designationStatus",
        "designation.submittedDate",
        "designation.startDate",
        "designation.endDate",
      ])
      .where("designation.institution.id = :institutionId", { institutionId })
      .orderBy(
        `CASE designation.designationStatus
            WHEN '${DesignationAgreementStatus.Pending}' THEN ${SortPriority.Priority1}
            WHEN '${DesignationAgreementStatus.Approved}' THEN ${SortPriority.Priority2}
            WHEN '${DesignationAgreementStatus.Declined}' THEN ${SortPriority.Priority3}
            ELSE ${SortPriority.Priority4}
          END`,
      )
      .addOrderBy("designation.submittedDate", "DESC")
      .getMany();
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
}
