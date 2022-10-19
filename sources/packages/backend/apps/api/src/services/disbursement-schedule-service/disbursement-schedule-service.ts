import { Injectable } from "@nestjs/common";
import {
  DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
  addDays,
  COE_WINDOW,
  COE_DENIED_REASON_OTHER_ID,
  PaginationOptions,
  FieldSortOrder,
  PaginatedResults,
  mapFromRawAndEntities,
  OrderByCondition,
} from "../../utilities";
import { DataSource, In, Repository, UpdateResult, Brackets } from "typeorm";
import { SequenceControlService } from "@sims/services";
import { StudentRestrictionService } from "..";
import {
  RecordDataModelService,
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  OfferingIntensity,
  StudentAssessment,
  User,
  RestrictionActionType,
} from "@sims/sims-db";
import {
  ECertDisbursementSchedule,
  EnrollmentPeriod,
} from "./disbursement-schedule.models";
import * as dayjs from "dayjs";

const DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP =
  "DISBURSEMENT_DOCUMENT_NUMBER";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly assessmentRepo: Repository<StudentAssessment>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
    this.assessmentRepo = dataSource.getRepository(StudentAssessment);
  }

  /**
   * Generates the next document number to be associated
   * with a disbursement.
   */
  private async getNextDocumentNumber(): Promise<number> {
    let nextDocumentNumber: number;
    await this.sequenceService.consumeNextSequence(
      DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP,
      async (nextSequenceNumber) => {
        nextDocumentNumber = nextSequenceNumber;
      },
    );
    return nextDocumentNumber;
  }

  /**
   * Get all records that must be part of the e-Cert files and that were not sent yet.
   * Criteria to be a valid disbursement to be sent.
   * - Not sent yet;
   * - Disbursement date in the past or in the near future (defined by DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS);
   * - Student had the SIN number validated by the CRA;
   * - Student has a valid signed MSFAA;
   * - No restrictions in the student account that prevents the disbursement;
   * - Application status must be 'Completed';
   * - Confirmation of enrollment(COE) must be 'Completed'.
   */
  async getECertInformationToBeSent(
    offeringIntensity: OfferingIntensity,
  ): Promise<ECertDisbursementSchedule[]> {
    const possibleRestrictionActions: RestrictionActionType[] =
      offeringIntensity === OfferingIntensity.fullTime
        ? [RestrictionActionType.StopFullTimeDisbursement]
        : [RestrictionActionType.StopPartTimeDisbursement];
    const stopFullTimeBCFunding: RestrictionActionType[] = [
      RestrictionActionType.StopFullTimeBCFunding,
    ];

    // Define the minimum date to send a disbursement.
    const disbursementMinDate = dayjs()
      .add(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS, "days")
      .toDate();

    const queryResult = await this.repo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.documentNumber",
        "disbursement.negotiatedExpiryDate",
        "disbursement.disbursementDate",
        "disbursement.tuitionRemittanceRequestedAmount",
        "application.applicationNumber",
        "application.data",
        "application.relationshipStatus",
        "application.studentNumber",
        "currentAssessment.id",
        "currentAssessment.assessmentData",
        "offering.id",
        "offering.courseLoad",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.yearOfStudy",
        "educationProgram.fieldOfStudyCode",
        "educationProgram.completionYears",
        "user.firstName",
        "user.lastName",
        "user.email",
        "sinValidation.id",
        "sinValidation.sin",
        "student.birthDate",
        "student.gender",
        "student.contactInfo",
        "institutionLocation.id",
        "institutionLocation.institutionCode",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursement.coeUpdatedAt",
        "studentAssessment.id",
      ])
      .addSelect(
        `CASE
            WHEN EXISTS(${this.studentRestrictionService
              .getExistsBlockRestrictionQuery(
                false,
                false,
                "restrictionActionType",
              )
              .getSql()}) THEN true
            ELSE false
        END`,
        "stopFullTimeBCFunding",
      )
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment") // * This is to fetch the current assessment of the application, even though we have multiple reassessments
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("application.student", "student") // ! The student alias here is also used in sub query 'getExistsBlockRestrictionQuery'.
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("application.msfaaNumber", "msfaaNumber")
      .innerJoin("disbursement.disbursementValues", "disbursementValue")
      .where("disbursement.dateSent is null")
      .andWhere("disbursement.disbursementDate <= :disbursementMinDate", {
        disbursementMinDate,
      })
      .andWhere("application.applicationStatus = :applicationStatus", {
        applicationStatus: ApplicationStatus.completed,
      })
      .andWhere("msfaaNumber.dateSigned is not null")
      .andWhere("sinValidation.isValidSIN = true")
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity,
      })
      .andWhere(
        `NOT EXISTS(${this.studentRestrictionService
          .getExistsBlockRestrictionQuery()
          .getSql()})`,
      )
      .andWhere("disbursement.coeStatus = :coeStatus", {
        coeStatus: COEStatus.completed,
      })
      .setParameter("restrictionActionType", stopFullTimeBCFunding)
      // 'restrictionActions' parameter used inside sub-query.
      .setParameter("restrictionActions", possibleRestrictionActions)
      .getRawAndEntities();
    return mapFromRawAndEntities<ECertDisbursementSchedule>(
      queryResult,
      "stopFullTimeBCFunding",
    );
  }

  /**
   * Once the e-Cert file is sent, updates the date that the file was uploaded.
   * @param disbursementIds records that are part of the generated
   * file that must have the date sent updated.
   * @param dateSent date that the file was uploaded.
   * @param [disbursementScheduleRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the result of the update.
   */
  async updateRecordsInSentFile(
    disbursementIds: number[],
    dateSent: Date,
    disbursementScheduleRepo?: Repository<DisbursementSchedule>,
  ) {
    if (!dateSent) {
      throw new Error(
        "Date sent field is not provided to update the disbursement records.",
      );
    }
    const repository = disbursementScheduleRepo ?? this.repo;
    return repository.update({ id: In(disbursementIds) }, { dateSent });
  }

  /**
   * Get DisbursementSchedule by documentNumber
   * @param documentNumber document Number
   * @returns DisbursementSchedule respective to passed documentNumber.
   */
  async getDisbursementScheduleByDocumentNumber(
    documentNumber: number,
  ): Promise<DisbursementSchedule> {
    return this.repo.findOne({ where: { documentNumber } });
  }

  /**
   * On COE Approval, update disbursement schedule with document number and
   * COE related columns. Update the Application status to completed, if it is first COE.
   * The update to Application and Disbursement schedule happens in single transaction.
   * @param disbursementScheduleId disbursement schedule Id.
   * @param userId User updating the confirmation of enrollment.
   * @param applicationId application Id.
   * @param applicationStatus application status of the disbursed application.
   * @param tuitionRemittanceRequestedAmount tuition remittance amount requested by the institution.
   */
  async updateDisbursementAndApplicationCOEApproval(
    disbursementScheduleId: number,
    userId: number,
    applicationId: number,
    applicationStatus: ApplicationStatus,
    tuitionRemittanceRequestedAmount: number,
  ): Promise<void> {
    const documentNumber = await this.getNextDocumentNumber();
    const auditUser = { id: userId } as User;
    const now = new Date();
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .getRepository(DisbursementSchedule)
        .createQueryBuilder()
        .update(DisbursementSchedule)
        .set({
          documentNumber: documentNumber,
          coeStatus: COEStatus.completed,
          coeUpdatedBy: auditUser,
          coeUpdatedAt: now,
          modifier: auditUser,
          updatedAt: now,
          tuitionRemittanceRequestedAmount: tuitionRemittanceRequestedAmount,
        })
        .where("id = :disbursementScheduleId", { disbursementScheduleId })
        .execute();

      if (applicationStatus === ApplicationStatus.enrollment) {
        await transactionalEntityManager
          .getRepository(Application)
          .createQueryBuilder()
          .update(Application)
          .set({
            applicationStatus: ApplicationStatus.completed,
            modifier: auditUser,
            updatedAt: now,
          })
          .where("id = :applicationId", { applicationId })
          .execute();
      }
    });
  }

  /**
   * Get the list of disbursement schedules for a given location as COE.
   ** COE values are retrieved only when an application reaches enrollment status.
   ** When the first COE is approved, application moves to complete status as per workflow but second COE is still
   ** waiting to be approved by institution.
   * @param locationId
   * @param enrollmentPeriod
   * @param paginationOptions
   * @returns List of COE for given location.
   */
  async getCOEByLocation(
    locationId: number,
    enrollmentPeriod: EnrollmentPeriod,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<DisbursementSchedule>> {
    const coeThresholdDate = addDays(new Date(), COE_WINDOW);
    const coeQuery = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.coeStatus",
        "application.applicationNumber",
        "application.id",
        "studentAssessment.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "student.id",
        "user.firstName",
        "user.lastName",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.enrollment, ApplicationStatus.completed],
      });
    if (enrollmentPeriod === EnrollmentPeriod.Upcoming) {
      coeQuery.andWhere(
        new Brackets((qb) => {
          qb.where(
            "disbursementSchedule.disbursementDate > :coeThresholdDate",
          ).orWhere("disbursementSchedule.coeStatus != :required", {
            required: COEStatus.required,
          });
        }),
      );
    } else {
      coeQuery
        .andWhere("disbursementSchedule.disbursementDate <= :coeThresholdDate")
        .andWhere("disbursementSchedule.coeStatus = :required", {
          required: COEStatus.required,
        });
    }
    coeQuery.setParameter("coeThresholdDate", coeThresholdDate);
    if (paginationOptions.searchCriteria) {
      coeQuery
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "CONCAT(user.firstName,' ', user.lastName) Ilike :searchCriteria",
            ).orWhere("application.applicationNumber Ilike :searchCriteria");
          }),
        )
        .setParameter(
          "searchCriteria",
          `%${paginationOptions.searchCriteria.trim()}%`,
        );
    }
    coeQuery
      .orderBy(
        this.transformToEntitySortField(
          paginationOptions.sortField,
          paginationOptions.sortOrder,
        ),
      )
      .offset(paginationOptions.page * paginationOptions.pageLimit)
      .limit(paginationOptions.pageLimit);
    const [result, count] = await coeQuery.getManyAndCount();
    return {
      results: result,
      count: count,
    };
  }

  /**
   * Returns Disbursement and application details for COE detail view.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id.
   * @returns Disbursement and Application details.
   */
  async getDisbursementAndApplicationDetails(
    locationId: number,
    disbursementScheduleId: number,
  ): Promise<DisbursementSchedule> {
    return this.repo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.disbursementDate",
        "disbursement.coeStatus",
        "disbursement.coeDeniedOtherDesc",
        "studentAssessment.id",
        "application.applicationNumber",
        "application.applicationStatus",
        "application.id",
        "application.pirStatus",
        "location.name",
        "location.id",
        "student.id",
        "user.firstName",
        "user.lastName",
        "offering.name",
        "offering.offeringIntensity",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.lacksStudyBreaks",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "offering.offeringDelivered",
        "offering.studyBreaks",
        "program.name",
        "program.description",
        "program.credentialType",
        "program.deliveredOnline",
        "program.deliveredOnSite",
        "coeDeniedReason.id",
        "coeDeniedReason.reason",
      ])
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("offering.educationProgram", "program")
      .leftJoin("disbursement.coeDeniedReason", "coeDeniedReason")
      .where("location.id = :locationId", { locationId })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.enrollment, ApplicationStatus.completed],
      })
      .andWhere("disbursement.id = :disbursementScheduleId", {
        disbursementScheduleId,
      })
      .getOne();
  }

  /**
   * Summary of disbursement and application for Approval/Denial of COE.
   * @param locationId location id.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @returns disbursement and application summary.
   */
  async getDisbursementAndApplicationSummary(
    locationId: number,
    disbursementScheduleId: number,
  ): Promise<DisbursementSchedule> {
    return this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "application.id",
        "application.applicationStatus",
        "studentAssessment.id",
        "studentAssessment.assessmentWorkflowId",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "disbursementValues.valueType",
        "disbursementValues.valueCode",
        "disbursementValues.valueAmount",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.offering", "offering")
      .innerJoin(
        "disbursementSchedule.disbursementValues",
        "disbursementValues",
      )
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("offering.institutionLocation", "location")
      .where("location.id = :locationId", { locationId })
      .andWhere("disbursementSchedule.id = :disbursementScheduleId", {
        disbursementScheduleId,
      })
      .andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.enrollment, ApplicationStatus.completed],
      })
      .getOne();
  }

  /**
   * Deny COE for a disbursement schedule.
   ** Note: If an application has 2 COEs, and if the first COE is rejected then 2nd COE is implicitly rejected.
   * @param disbursementScheduleId disbursement schedule id to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param coeDeniedReasonId denied reason id of a denied COE.
   * @param otherReasonDesc result of the update operation.
   */
  async updateCOEToDenied(
    disbursementScheduleId: number,
    auditUserId: number,
    coeDeniedReasonId: number,
    otherReasonDesc: string,
  ): Promise<UpdateResult> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    const updateResult = await this.repo
      .createQueryBuilder()
      .update(DisbursementSchedule)
      .set({
        coeStatus: COEStatus.declined,
        coeUpdatedBy: auditUser,
        coeUpdatedAt: now,
        coeDeniedReason: { id: coeDeniedReasonId },
        coeDeniedOtherDesc:
          coeDeniedReasonId === COE_DENIED_REASON_OTHER_ID
            ? otherReasonDesc
            : null,
        modifier: auditUser,
        updatedAt: now,
      })
      .where("id = :disbursementScheduleId", { disbursementScheduleId })
      .andWhere("coeStatus = :required", { required: COEStatus.required })
      .execute();

    if (updateResult.affected !== 1) {
      throw new Error(
        `While updating COE status to '${COEStatus.declined}' the number of affected row was bigger than the expected one. Expected 1 received ${updateResult.affected}`,
      );
    }

    return updateResult;
  }

  /**
   * Get the first disbursement schedule of a disbursement.
   * @param options options to execute the search. If onlyPendingCOE is true,
   * only records with coeStatus defined as 'Required' will be considered.
   * @returns first disbursement schedule, if any.
   */
  async getFirstDisbursementSchedule(options: {
    disbursementScheduleId?: number;
    applicationId?: number;
    onlyPendingCOE?: boolean;
  }): Promise<DisbursementSchedule> {
    const query = this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.coeStatus",
        "disbursementSchedule.coeDeniedOtherDesc",
        "coeDeniedReason.id",
        "coeDeniedReason.reason",
        "studentAssessment.id",
        "application.id",
        "application.applicationStatus",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .leftJoin("disbursementSchedule.coeDeniedReason", "coeDeniedReason")
      .where("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.enrollment, ApplicationStatus.completed],
      });

    if (options.applicationId) {
      query.andWhere("application.id = :applicationId", {
        applicationId: options.applicationId,
      });
    }

    if (options.disbursementScheduleId) {
      query.andWhere("disbursementSchedule.id = :disbursementScheduleId", {
        disbursementScheduleId: options.disbursementScheduleId,
      });
    }

    if (options.onlyPendingCOE) {
      query.andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      });
    }

    query.orderBy("disbursementSchedule.disbursementDate").limit(1);
    return query.getOne();
  }

  /**
   **Transformation to convert the data table column name to database column name
   **Any changes to the data object (e.g data table) in presentation layer must be adjusted here.
   * @param sortField
   * @param sortOrder
   * @returns OrderByCondition
   */
  private transformToEntitySortField(
    sortField: string,
    sortOrder: FieldSortOrder,
  ): OrderByCondition {
    const orderByCondition = {};
    if (sortField === "fullName") {
      orderByCondition["user.firstName"] = sortOrder;
      orderByCondition["user.lastName"] = sortOrder;
      return orderByCondition;
    }

    const coeSortOptions = {
      applicationNumber: "application.applicationNumber",
      disbursementDate: "disbursementSchedule.disbursementDate",
    };
    const dbColumnName =
      coeSortOptions[sortField] || "disbursementSchedule.coeStatus";
    orderByCondition[dbColumnName] = sortOrder;
    return orderByCondition;
  }

  /**
   * Get disbursement schedules by document numbers.
   * @param documentNumbers document numbers of disbursements.
   * @returns disbursement schedules.
   */
  async getDisbursementsByDocumentNumbers(
    documentNumbers: number[],
  ): Promise<DisbursementSchedule[]> {
    return this.repo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.documentNumber",
      ])
      .where("disbursementSchedule.documentNumber IN (:...documentNumbers)", {
        documentNumbers,
      })
      .getMany();
  }
}
