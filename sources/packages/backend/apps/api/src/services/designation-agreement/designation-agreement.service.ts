import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import {
  RecordDataModelService,
  DesignationAgreement,
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  Note,
  NoteType,
  User,
} from "@sims/sims-db";
import {
  UpdateDesignationDetailsAPIInDTO,
  DesignationLocationAPIInDTO,
} from "../../route-controllers/designation-agreement/models/designation-agreement.dto";
import {
  InstitutionRequestsDesignationNotificationForMinistry,
  NotificationActionsService,
} from "@sims/services";

/**
 * Manages the operations needed for designation agreements that are submitted by the institutions
 * and then need to be reviewed by the Ministry for approval or denial. While the Ministry is
 * approving the designation it can also edit dates and locations as needed.
 */
@Injectable()
export class DesignationAgreementService extends RecordDataModelService<DesignationAgreement> {
  private readonly institutionRepo: Repository<Institution>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(dataSource.getRepository(DesignationAgreement));
    this.institutionRepo = dataSource.getRepository(Institution);
  }

  /**
   * Initiates a new designation agreement request. This action
   * is meant to me initiated by the institution signing officer
   * for further assessment of the Ministry.
   * The designation agreement and the location that are part of it will
   * be saved as part of the same DB transaction. This transaction will also
   * save an institution designation request notification for the ministry.
   * @param institutionId institution id requesting the designation.
   * @param submittedData dynamic data that represents the designation requested.
   * @param submittedByUserId institution user submitting the designation.
   * @param requestedLocationsIds ids of the locations requested to be designated.
   * @returns the new designation agreement created.
   */
  async submitDesignationAgreement(
    institutionId: number,
    submittedData: unknown,
    submittedByUserId: number,
    requestedLocationsIds: number[],
  ): Promise<DesignationAgreement> {
    const submittedByUser = { id: submittedByUserId } as User;
    const now = new Date();
    const newDesignation = new DesignationAgreement();
    newDesignation.institution = { id: institutionId } as Institution;
    newDesignation.submittedData = submittedData;
    newDesignation.designationStatus = DesignationAgreementStatus.Pending;
    newDesignation.submittedBy = submittedByUser;
    newDesignation.submittedDate = now;
    newDesignation.creator = submittedByUser;
    newDesignation.createdAt = now;
    newDesignation.designationAgreementLocations = requestedLocationsIds.map(
      (locationId: number) => {
        const newLocation = new DesignationAgreementLocation();
        newLocation.institutionLocation = {
          id: locationId,
        } as InstitutionLocation;
        newLocation.requested = true;
        newLocation.creator = submittedByUser;
        newLocation.createdAt = now;
        return newLocation;
      },
    );
    const institution = await this.institutionRepo.findOne({
      select: {
        operatingName: true,
        legalOperatingName: true,
        primaryEmail: true,
      },
      where: { id: institutionId },
    });
    const ministryNotification: InstitutionRequestsDesignationNotificationForMinistry =
      {
        institutionName: institution.legalOperatingName,
        institutionOperatingName: institution.operatingName,
        institutionPrimaryEmail: institution.primaryEmail,
      };
    return this.dataSource.transaction(async (entityManager) => {
      await this.notificationActionsService.saveInstitutionRequestsDesignationNotificationForMinistry(
        ministryNotification,
        entityManager,
      );
      return entityManager
        .getRepository(DesignationAgreement)
        .save(newDesignation);
    });
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
        "designation.startDate",
        "designation.endDate",
        "designationLocation.id",
        "designationLocation.requested",
        "designationLocation.approved",
        "location.id",
        "location.name",
        "location.data",
        "institution.id",
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
   * Service to get all designations by status.
   * @param searchCriteria
   * @returns designation summary.
   */
  async getDesignationAgreementsByStatus(
    designationStatus: DesignationAgreementStatus,
    searchCriteria: string,
  ): Promise<DesignationAgreement[]> {
    return this.getDesignationSummaryByFilter(
      "designation.designationStatus",
      designationStatus,
      searchCriteria,
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
   * Service to get designation agreement which is eligible for update.
   * @param designationId
   * @returns flag that indicates if the designationId is valid data.
   */
  async getDesignationForUpdate(
    designationId: number,
  ): Promise<DesignationAgreement> {
    return this.repo
      .createQueryBuilder("designation")
      .select([
        "designation.id",
        "designationAgreementLocations.id",
        "location.id",
        "institution.id",
      ])
      .innerJoin(
        "designation.designationAgreementLocations",
        "designationAgreementLocations",
      )
      .innerJoin(
        "designationAgreementLocations.institutionLocation",
        "location",
      )
      .innerJoin("designation.institution", "institution")
      .where("designation.id = :designationId", { designationId })
      .andWhere("designation.designationStatus != :designationStatus", {
        designationStatus: DesignationAgreementStatus.Declined,
      })
      .getOne();
  }

  /**
   * Update designation for Approval/Denial or re-approve.
   * @param designationId Designation which is going to be updated.
   * @param userId User who updates the designation.
   * @param designationPayload update payload.
   */
  async updateDesignation(
    designationId: number,
    institutionId: number,
    userId: number,
    designationPayload: UpdateDesignationDetailsAPIInDTO,
    designationLocations: DesignationAgreementLocation[],
  ): Promise<void> {
    const auditUser = { id: userId } as User;
    const now = new Date();
    const designation = new DesignationAgreement();
    designation.id = designationId;
    designation.designationStatus = designationPayload.designationStatus;
    designation.startDate = designationPayload.startDate;
    designation.endDate = designationPayload.endDate;
    designation.assessedBy = auditUser;
    designation.assessedDate = now;
    designation.modifier = auditUser;
    designation.updatedAt = now;
    if (
      designationPayload.designationStatus ===
      DesignationAgreementStatus.Approved
    ) {
      designation.designationAgreementLocations =
        this.buildDesignationLocations(
          designationPayload.locationsDesignations,
          designationLocations,
          userId,
          now,
        );
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .getRepository(DesignationAgreement)
        .save(designation);

      const note = new Note();
      note.noteType = NoteType.Designation;
      note.description = designationPayload.note;
      note.creator = { id: userId } as User;

      const updateNote = await transactionalEntityManager
        .getRepository(Note)
        .save(note);

      await transactionalEntityManager
        .getRepository(Institution)
        .createQueryBuilder()
        .relation(Institution, "notes")
        .of({ id: institutionId } as Institution)
        .add(updateNote);
    });
  }
  /**
   * Private service method that retrieves designation summary
   * based on the given filter.
   * Any query for designations list with single criteria can be
   * sufficed by this filter method.
   * @param filterColumn
   * @param filterValue
   * @param searchCriteria
   * @returns designation summary.
   */
  private async getDesignationSummaryByFilter(
    filterColumn: string,
    filterValue: number | string,
    searchCriteria?: string,
  ): Promise<DesignationAgreement[]> {
    const designationQuery = this.repo
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
      .where(`${filterColumn} = :filterValue`, { filterValue });
    if (searchCriteria) {
      designationQuery.andWhere(
        "institution.legalOperatingName Ilike :searchCriteria",
        { searchCriteria: `%${searchCriteria}%` },
      );
    }
    return designationQuery
      .orderBy("designation.designationStatus", "ASC")
      .addOrderBy("designation.submittedDate", "DESC")
      .getMany();
  }

  /**
   * Private method to build designation locations for update.
   * This builder is only for designation Approval.
   * @param locationsDesignations designation locations to be added/updated
   * for a designation agreement.
   * @param designationLocations existing designation locations
   * of a designation agreement.
   * @Param designationUpdatedDate timestamp of designation agreement created/updated.
   * @param auditUserId user who is making the changes.
   * @returns Designation locations for approval.
   */
  private buildDesignationLocations(
    locationsDesignations: DesignationLocationAPIInDTO[],
    designationLocations: DesignationAgreementLocation[],
    auditUserId: number,
    designationUpdatedDate: Date,
  ): DesignationAgreementLocation[] {
    const auditUser = { id: auditUserId } as User;
    return locationsDesignations.map(
      (locationPayload: DesignationLocationAPIInDTO) => {
        const location = new DesignationAgreementLocation();

        location.approved = locationPayload.approved;
        location.institutionLocation = {
          id: locationPayload.locationId,
        } as InstitutionLocation;

        const designationLocation = designationLocations.find(
          (item) => item.institutionLocation.id === locationPayload.locationId,
        );
        // When a designation location already exist assign the id
        // and audit properties.
        if (designationLocation) {
          location.id = designationLocation.id;
          location.modifier = auditUser;
          location.updatedAt = designationUpdatedDate;
        }
        // When the designation location is not an existing one
        // then it is added by the ministry during approval process.
        // Set requested as false as it was not requested by the institution and
        // set the audit properties.
        else {
          location.creator = auditUser;
          location.createdAt = designationUpdatedDate;
          location.requested = false;
        }
        return location;
      },
    );
  }
}
