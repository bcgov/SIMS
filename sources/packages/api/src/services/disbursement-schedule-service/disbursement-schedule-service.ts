import { Injectable } from "@nestjs/common";
import {
  CustomNamedError,
  DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS,
  addDays,
  COE_WINDOW,
  COE_DENIED_REASON_OTHER_ID,
  PaginationOptions,
  FieldSortOrder,
  PaginatedResults,
} from "../../utilities";
import {
  Connection,
  In,
  Repository,
  UpdateResult,
  Brackets,
  OrderByCondition,
} from "typeorm";
import { SequenceControlService, StudentRestrictionService } from "..";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementSchedule,
  DisbursementValue,
  OfferingIntensity,
  StudentAssessment,
} from "../../database/entities";
import { Disbursement, EnrollmentPeriod } from "./disbursement-schedule.models";
import * as dayjs from "dayjs";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "../student-assessment/student-assessment.constants";
import { RestrictionActionType } from "../../database/entities/restriction-action-type.type";

const DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP =
  "DISBURSEMENT_DOCUMENT_NUMBER";

/**
 * Service layer for Student Application disbursement schedules.
 */
@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  private readonly assessmentRepo: Repository<StudentAssessment>;
  constructor(
    private readonly connection: Connection,
    private readonly sequenceService: SequenceControlService,
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super(connection.getRepository(DisbursementSchedule));
    this.assessmentRepo = connection.getRepository(StudentAssessment);
  }

  /**
   * Create the disbursements while the application is 'In Progress'.
   * Ensures that the application do not have any disbursements records
   * and creates the disbursements and values altogether.
   * ! This methods should be called for the first time when the
   * ! disbursements are being added to the Student Application.
   * ! Once the Student Application already has disbursements, another
   * ! scenarios must be considered, for instance, if some amount of money
   * ! was already released to the student.
   * @param assessmentId application id to associate the disbursements.
   * @param disbursements array of disbursements and values to be created.
   * @returns created disbursements.
   */
  async createDisbursementSchedules(
    assessmentId: number,
    disbursements: Disbursement[],
  ): Promise<DisbursementSchedule[]> {
    const assessment = await this.assessmentRepo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "assessment.triggerType",
        "application.id",
        "application.applicationStatus",
        "disbursementSchedules.id",
      ])
      .innerJoin("assessment.application", "application")
      .leftJoin("assessment.disbursementSchedules", "disbursementSchedules")
      .where("assessment.id = :assessmentId", { assessmentId })
      .getOne();

    if (!assessment) {
      throw new CustomNamedError(
        "Student assessment not found.",
        ASSESSMENT_NOT_FOUND,
      );
    }

    if (
      assessment.triggerType === AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.inProgress
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting assessment status '${AssessmentTriggerType.OriginalAssessment}' when the application status is '${ApplicationStatus.inProgress}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.completed
    ) {
      throw new CustomNamedError(
        `Student Assessment and Student Application are not in the expected status. Expecting application status '${ApplicationStatus.completed}' when the assessment status is not '${AssessmentTriggerType.OriginalAssessment}'.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (assessment.disbursementSchedules?.length > 0) {
      throw new CustomNamedError(
        `Disbursements were already created for this Student Assessment.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    for (const disbursement of disbursements) {
      const newDisbursement = new DisbursementSchedule();
      newDisbursement.disbursementDate = disbursement.disbursementDate;
      newDisbursement.negotiatedExpiryDate = disbursement.negotiatedExpiryDate;
      newDisbursement.disbursementValues = disbursement.disbursements.map(
        (disbursementValue) => {
          const newValue = new DisbursementValue();
          newValue.valueType = disbursementValue.valueType;
          newValue.valueCode = disbursementValue.valueCode;
          newValue.valueAmount = disbursementValue.valueAmount.toString();
          return newValue;
        },
      );
      assessment.disbursementSchedules.push(newDisbursement);
    }

    await this.assessmentRepo.save(assessment);
    return assessment.disbursementSchedules;
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
  ): Promise<DisbursementSchedule[]> {
    let possibleRestrictionActions: RestrictionActionType[];
    if (offeringIntensity === OfferingIntensity.fullTime) {
      possibleRestrictionActions = [
        RestrictionActionType.StopFullTimeDisbursement,
      ];
    }
    if (offeringIntensity === OfferingIntensity.partTime) {
      possibleRestrictionActions = [
        RestrictionActionType.StopPartTimeDisbursement,
      ];
    }
    // Define the minimum date to send a disbursement.
    const disbursementMinDate = dayjs()
      .add(DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS, "days")
      .toDate();

    return this.repo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.documentNumber",
        "disbursement.negotiatedExpiryDate",
        "disbursement.disbursementDate",
        "application.applicationNumber",
        "application.data",
        "application.relationshipStatus",
        "application.studentNumber",
        "currentAssessment.id",
        "currentAssessment.assessmentData",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.tuitionRemittanceRequestedAmount",
        "offering.yearOfStudy",
        "educationProgram.cipCode",
        "educationProgram.completionYears",
        "user.firstName",
        "user.lastName",
        "user.email",
        "student.sin",
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
          .getExistsBlockRestrictionQuery(possibleRestrictionActions)
          .getSql()})`,
      )
      .andWhere("disbursement.coeStatus = :coeStatus", {
        coeStatus: COEStatus.completed,
      })
      .getMany();
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
    return this.repo.findOne({ documentNumber: documentNumber });
  }

  /**
   * On COE Approval, update disbursement schedule with document number and
   * COE related columns. Update the Application status to completed, if it is first COE.
   * The update to Application and Disbursement schedule happens in single transaction.
   * @param disbursementScheduleId
   * @param userId
   * @param applicationId
   * @param applicationStatus
   */
  async updateDisbursementAndApplicationCOEApproval(
    disbursementScheduleId: number,
    userId: number,
    applicationId: number,
    applicationStatus: ApplicationStatus,
  ): Promise<void> {
    const documentNumber = await this.getNextDocumentNumber();
    return this.connection.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .getRepository(DisbursementSchedule)
        .createQueryBuilder()
        .update(DisbursementSchedule)
        .set({
          documentNumber: documentNumber,
          coeStatus: COEStatus.completed,
          coeUpdatedBy: { id: userId },
          coeUpdatedAt: new Date(),
        })
        .where("id = :disbursementScheduleId", { disbursementScheduleId })
        .execute();

      if (applicationStatus === ApplicationStatus.enrollment) {
        await transactionalEntityManager
          .getRepository(Application)
          .createQueryBuilder()
          .update(Application)
          .set({ applicationStatus: ApplicationStatus.completed })
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
   * @param disbursementScheduleId
   * @param locationId
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
        "offering.tuitionRemittanceRequested",
        "offering.tuitionRemittanceRequestedAmount",
        "offering.offeringDelivered",
        "offering.studyBreaks",
        "program.name",
        "program.description",
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
   * @param locationId
   * @param disbursementScheduleId
   * @returns Disbursement and Application Summary.
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
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.location", "location")
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
   * Deny COE for an application.
   ** Note: If an application has 2 COEs, and if the first COE is Rejected then 2nd COE is implicitly rejected.
   * @param disbursementScheduleIds
   * @param userId User who denies the COE.
   * @param coeDeniedReasonId Denied reason id of a denied COE.
   * @param otherReasonDesc If the denied reason is other, respective description.
   */
  async updateCOEToDeny(
    applicationId: number,
    userId: number,
    coeDeniedReasonId: number,
    otherReasonDesc: string,
  ): Promise<UpdateResult> {
    return this.repo
      .createQueryBuilder()
      .update(DisbursementSchedule)
      .set({
        coeStatus: COEStatus.declined,
        coeUpdatedBy: { id: userId },
        coeUpdatedAt: new Date(),
        coeDeniedReason: { id: coeDeniedReasonId },
        coeDeniedOtherDesc:
          coeDeniedReasonId === COE_DENIED_REASON_OTHER_ID
            ? otherReasonDesc
            : null,
      })
      .where("application.id = :applicationId", { applicationId })
      .andWhere("coeStatus = :required", { required: COEStatus.required })
      .execute();
  }

  /**
   * Return the first COE details of an application.
   **If @param onlyPendingCOE is true, then it returns first pending/outstanding COE
   **for an application.
   * @param applicationId
   * @param onlyPendingCOE
   * @returns Disbursement
   */
  async getFirstCOEOfApplication(
    applicationId: number,
    onlyPendingCOE?: boolean,
  ): Promise<DisbursementSchedule> {
    const firstCOEQuery = this.repo
      .createQueryBuilder("disbursement")
      .select([
        "disbursement.id",
        "disbursement.coeStatus",
        "disbursement.coeDeniedOtherDesc",
        "coeDeniedReason.id",
        "coeDeniedReason.reason",
        "studentAssessment.id",
        "application.id",
        "application.applicationStatus",
      ])
      .innerJoin("disbursement.studentAssessment", "studentAssessment")
      .innerJoin("studentAssessment.application", "application")
      .leftJoin("disbursement.coeDeniedReason", "coeDeniedReason")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.enrollment, ApplicationStatus.completed],
      });
    if (onlyPendingCOE) {
      firstCOEQuery.andWhere("disbursement.coeStatus = :required", {
        required: COEStatus.required,
      });
    }
    firstCOEQuery.orderBy("disbursement.disbursementDate").limit(1);
    return firstCOEQuery.getOne();
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
}
