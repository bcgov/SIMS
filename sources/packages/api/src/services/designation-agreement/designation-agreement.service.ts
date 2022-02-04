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

/**
 * Manages the operations needed for designation agreements that are submitted by the institutions
 * and then need to be reviewed by the Ministry for approval or denial. After the Ministry approves
 * the a designation it could also edit dates and locations as needed.
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
      (institutionId: number) => {
        const newLocation = new DesignationAgreementLocation();
        newLocation.institutionLocation = {
          id: institutionId,
        } as InstitutionLocation;
        newLocation.requested = true;
        newLocation.creator = submittedByUser;
        return newLocation;
      },
    );
    return await this.repo.save(newDesignation);
  }

  /**
   * Retrieve the designation agreement information and
   * the associated locations approvals.
   * @param designationId designation id.
   * @param institutionId institution id.
   * @returns designation agreement information.
   */
  async getDesignationById(
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
}
