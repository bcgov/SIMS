import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  DisbursementValueType,
  User,
} from "@sims/sims-db";
import { DataSource, EntityManager, Repository, UpdateResult } from "typeorm";
import {
  Award,
  COEApprovalPeriodStatus,
  MaxTuitionRemittanceTypes,
  OfferingCosts,
} from "./models/confirmation-of-enrollment.models";
import {
  COE_WINDOW,
  CustomNamedError,
  addDays,
  getISODateOnlyString,
  isBeforeDate,
  isBetweenPeriod,
} from "@sims/utilities";
import { SequenceControlService } from "../sequence-control/sequence-control.service";
import { NotificationActionsService } from "../notifications";
import {
  DISBURSEMENT_DOCUMENT_NUMBER_SEQUENCE_GROUP,
  ENROLMENT_ALREADY_COMPLETED,
  ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
  ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ENROLMENT_NOT_FOUND,
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "../constants";

/**
 * Types of awards considered for the max tuition remittance calculation.
 */
const TUITION_REMITTANCE_AWARD_TYPES = [
  DisbursementValueType.CanadaLoan,
  DisbursementValueType.BCLoan,
  DisbursementValueType.CanadaGrant,
];

@Injectable()
export class ConfirmationOfEnrollmentService {
  constructor(
    @InjectRepository(DisbursementSchedule)
    private readonly disbursementScheduleRepo: Repository<DisbursementSchedule>,
    private readonly dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Get the maximum estimated tuition remittance for the provided disbursement.
   * @param disbursementId disbursement id.
   * @returns maximum estimated tuition remittance if any, otherwise null.
   */
  async getEstimatedMaxTuitionRemittance(
    disbursementId: number,
  ): Promise<number | null> {
    const maxTuitionRemittanceData =
      await this.disbursementScheduleRepo.findOne({
        select: {
          id: true,
          disbursementValues: {
            id: true,
            valueType: true,
            valueAmount: true,
            disbursedAmountSubtracted: true,
          },
          studentAssessment: {
            id: true,
            offering: {
              id: true,
              actualTuitionCosts: true,
              programRelatedCosts: true,
            },
          },
        },
        relations: {
          disbursementValues: true,
          studentAssessment: {
            offering: true,
          },
        },
        where: {
          id: disbursementId,
        },
      });
    if (!maxTuitionRemittanceData) {
      return null;
    }
    return this.getMaxTuitionRemittance(
      maxTuitionRemittanceData.disbursementValues,
      maxTuitionRemittanceData.studentAssessment.offering,
      MaxTuitionRemittanceTypes.Estimated,
    );
  }

  /**
   * Calculate the max tuition remittance for a disbursement.
   * @param awards awards that will be disbursed.
   * @param offeringCosts offering costs to be considered.
   * @param calculationType effective or estimated calculation.
   * Before the disbursement happen, the value for the max tuition
   * remittance can only be estimated. It is because the real values,
   * with all possible deductions, will be known only upon e-Cert
   * generation. Once the disbursement(e-Cert creation) happen,
   * the effective value for every award will be persisted and the
   * maximum tuition remittance would be known.
   * @returns max tuition remittance for a disbursement.
   */
  getMaxTuitionRemittance(
    awards: Award[],
    offeringCosts: OfferingCosts,
    calculationType: MaxTuitionRemittanceTypes,
  ): number {
    let totalAwards = 0;
    const tuitionAwards = awards.filter((award) =>
      TUITION_REMITTANCE_AWARD_TYPES.includes(award.valueType),
    );
    if (calculationType === MaxTuitionRemittanceTypes.Effective) {
      // Use the values calculated upon disbursement (e-Cert generation).
      totalAwards = tuitionAwards.reduce(
        (total, award) => total + (award.effectiveAmount ?? 0),
        0,
      );
    } else {
      // Estimate the max tuition base in what is known before disbursement (e-Cert generation).
      totalAwards = tuitionAwards.reduce(
        (total, award) =>
          total + award.valueAmount - (award.disbursedAmountSubtracted ?? 0),
        0,
      );
    }
    const offeringTotalCosts =
      offeringCosts.actualTuitionCosts + offeringCosts.programRelatedCosts;
    return Math.min(offeringTotalCosts, totalAwards);
  }

  /**
   * Disbursement and application details of the given disbursement.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id.
   * @returns disbursement and application summary.
   */
  private async getDisbursementAndApplicationSummary(
    disbursementScheduleId: number,
    locationId?: number,
  ): Promise<DisbursementSchedule> {
    const disbursementAndApplicationQuery = this.disbursementScheduleRepo
      .createQueryBuilder("disbursementSchedule")
      .select([
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.coeStatus",
        "application.id",
        "application.applicationStatus",
        "application.applicationNumber",
        "studentAssessment.id",
        "studentAssessment.assessmentWorkflowId",
        "currentAssessment.id",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.studyEndDate",
        "disbursementValues.valueType",
        "disbursementValues.valueCode",
        "disbursementValues.valueAmount",
      ])
      .innerJoin("disbursementSchedule.studentAssessment", "studentAssessment")
      .innerJoin(
        "disbursementSchedule.disbursementValues",
        "disbursementValues",
      )
      .innerJoin("studentAssessment.application", "application")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("offering.institutionLocation", "location")
      .where("disbursementSchedule.id = :disbursementScheduleId", {
        disbursementScheduleId,
      });

    if (locationId) {
      disbursementAndApplicationQuery.andWhere("location.id = :locationId", {
        locationId,
      });
    }
    return disbursementAndApplicationQuery.getOne();
  }

  /**
   * Get COE approval period status which defines
   * if the COE can be confirmed by institution on current date.
   * @param disbursementDate disbursement date.
   * @param studyEndDate study end date of the offering.
   * @param enrolmentConfirmationDate date of confirmation of enrolment.
   * @returns COE approval period status.
   */
  getCOEApprovalPeriodStatus(
    disbursementDate: string | Date,
    studyEndDate: string | Date,
    enrolmentConfirmationDate?: string | Date,
  ): COEApprovalPeriodStatus {
    if (!disbursementDate || !studyEndDate) {
      throw new Error(
        "disbursementDate and studyEndDate are required for COE window verification.",
      );
    }
    // Enrolment period start date(COE_WINDOW days before disbursement date).
    const enrolmentPeriodStart = addDays(-COE_WINDOW, disbursementDate);
    //Current date as date only string.
    const coeConfirmationDate = getISODateOnlyString(
      enrolmentConfirmationDate ?? new Date(),
    );
    // Enrolment period end date is study period end date.
    // Is the enrolment now within eligible approval period.
    if (
      isBetweenPeriod(coeConfirmationDate, {
        startDate: enrolmentPeriodStart,
        endDate: studyEndDate,
      })
    ) {
      return COEApprovalPeriodStatus.WithinApprovalPeriod;
    }
    // Is the enrolment now before the eligible approval period.
    if (isBeforeDate(coeConfirmationDate, enrolmentPeriodStart)) {
      return COEApprovalPeriodStatus.BeforeApprovalPeriod;
    }

    return COEApprovalPeriodStatus.AfterApprovalPeriod;
  }

  /**
   * Get the first disbursement schedule of an application.
   * @param applicationId application id.
   * @param onlyPendingCOE If onlyPendingCOE is true,
   * only records with coeStatus defined as 'Required' will be considered.
   * @returns first disbursement schedule, if any.
   */
  async getFirstDisbursementScheduleByApplication(
    applicationId: number,
    onlyPendingCOE?: boolean,
  ): Promise<DisbursementSchedule> {
    const query = this.disbursementScheduleRepo
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
      .innerJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("disbursementSchedule.coeDeniedReason", "coeDeniedReason")
      .where("studentAssessment.id = currentAssessment.id")
      .andWhere("application.applicationStatus IN (:...status)", {
        status: [ApplicationStatus.Enrolment, ApplicationStatus.Completed],
      })
      .andWhere("application.id = :applicationId", {
        applicationId: applicationId,
      });

    if (onlyPendingCOE) {
      query.andWhere("disbursementSchedule.coeStatus = :required", {
        required: COEStatus.required,
      });
    }

    query.orderBy("disbursementSchedule.disbursementDate").limit(1);
    return query.getOne();
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
  private async updateDisbursementAndApplicationCOEApproval(
    disbursementScheduleId: number,
    userId: number,
    applicationId: number,
    applicationStatus: ApplicationStatus,
    tuitionRemittanceRequestedAmount: number,
    enrolmentConfirmationDate?: Date,
  ): Promise<void> {
    const documentNumber = await this.getNextDocumentNumber();
    const auditUser = { id: userId } as User;
    const coeConfirmationDate = enrolmentConfirmationDate ?? new Date();

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager
        .getRepository(DisbursementSchedule)
        .createQueryBuilder()
        .update(DisbursementSchedule)
        .set({
          documentNumber: documentNumber,
          coeStatus: COEStatus.completed,
          coeUpdatedBy: auditUser,
          coeUpdatedAt: coeConfirmationDate,
          modifier: auditUser,
          updatedAt: coeConfirmationDate,
          tuitionRemittanceRequestedAmount: tuitionRemittanceRequestedAmount,
        })
        .where("id = :disbursementScheduleId", { disbursementScheduleId })
        .execute();

      if (applicationStatus === ApplicationStatus.Enrolment) {
        await transactionalEntityManager
          .getRepository(Application)
          .createQueryBuilder()
          .update(Application)
          .set({
            applicationStatus: ApplicationStatus.Completed,
            modifier: auditUser,
            updatedAt: coeConfirmationDate,
          })
          .where("id = :applicationId", { applicationId })
          .execute();
      }
      // Create a student notification when COE is confirmed.
      await this.createNotificationForDisbursementUpdate(
        disbursementScheduleId,
        userId,
        transactionalEntityManager,
      );
    });
  }

  /**
   * Create institution confirm COE notification to notify student
   * when institution confirms a COE to their application.
   * @param disbursementScheduleId updated disbursement schedule.
   * @param auditUserId user who creates notification.
   * @param transactionalEntityManager entity manager to execute in transaction.
   */
  private async createNotificationForDisbursementUpdate(
    disbursementScheduleId: number,
    auditUserId: number,
    transactionalEntityManager: EntityManager,
  ): Promise<void> {
    const disbursement = await transactionalEntityManager
      .getRepository(DisbursementSchedule)
      .findOne({
        select: {
          id: true,
          studentAssessment: {
            id: true,
            application: {
              id: true,
              student: {
                id: true,
                user: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        relations: {
          studentAssessment: { application: { student: { user: true } } },
        },
        where: { id: disbursementScheduleId },
      });

    const studentUser = disbursement.studentAssessment.application.student.user;
    await this.notificationActionsService.saveInstitutionCompletesCOENotification(
      {
        givenNames: studentUser.firstName,
        lastName: studentUser.lastName,
        toAddress: studentUser.email,
        userId: studentUser.id,
      },
      auditUserId,
      transactionalEntityManager,
    );
  }

  /**
   * Decline COE for a disbursement schedule.
   ** Note: If an application has 2 COEs, and if the first COE is rejected then 2nd COE is implicitly rejected.
   * @param disbursementScheduleId disbursement schedule id to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param declinedReason COE declined reason details.
   * - `coeDeniedReasonId` Denied reason id.
   * - `otherReasonDesc` Other reason if the COE decline reason is other.
   * @param otherReasonDesc result of the update operation.
   */
  private async updateCOEToDeclined(
    disbursementScheduleId: number,
    auditUserId: number,
    declinedReason: { coeDeniedReasonId: number; otherReasonDesc?: string },
  ): Promise<UpdateResult> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        const updateResult = await transactionalEntityManager
          .getRepository(DisbursementSchedule)
          .createQueryBuilder()
          .update(DisbursementSchedule)
          .set({
            coeStatus: COEStatus.declined,
            coeUpdatedBy: auditUser,
            coeUpdatedAt: now,
            coeDeniedReason: { id: declinedReason.coeDeniedReasonId },
            coeDeniedOtherDesc: declinedReason.otherReasonDesc,
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

        // Create a student notification when COE is confirmed.
        await this.createNotificationForDisbursementUpdate(
          disbursementScheduleId,
          auditUserId,
          transactionalEntityManager,
        );

        return updateResult;
      },
    );
  }
  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param auditUserId user who confirms enrollment.
   * @param tuitionRemittance tuition remittance amount.
   * @param options Confirm COE options.
   * - `locationId` location id of the application.
   * - `allowOutsideCOEApprovalPeriod` allow COEs which are outside the valid COE confirmation period to be confirmed..
   * - `enrolmentConfirmationDate` date of enrolment confirmation.
   * - `applicationNumber` application number of the enrolment.
   */
  async confirmEnrollment(
    disbursementScheduleId: number,
    auditUserId: number,
    tuitionRemittance: number,
    options?: {
      locationId?: number;
      allowOutsideCOEApprovalPeriod?: boolean;
      enrolmentConfirmationDate?: Date;
      applicationNumber?: string;
    },
  ): Promise<void> {
    // Get the disbursement and application summary for COE.
    const disbursementSchedule =
      await this.getDisbursementAndApplicationSummary(
        disbursementScheduleId,
        options?.locationId,
      );

    if (!disbursementSchedule) {
      throw new CustomNamedError("Enrolment not found.", ENROLMENT_NOT_FOUND);
    }

    const application = disbursementSchedule.studentAssessment.application;

    if (
      options?.applicationNumber &&
      options?.applicationNumber !== application.applicationNumber
    ) {
      throw new CustomNamedError(
        "Enrolment for the given application not found.",
        ENROLMENT_NOT_FOUND,
      );
    }

    if (disbursementSchedule.coeStatus !== COEStatus.required) {
      throw new CustomNamedError(
        "Enrolment already completed and can neither be confirmed nor declined",
        ENROLMENT_ALREADY_COMPLETED,
      );
    }

    if (
      ![ApplicationStatus.Enrolment, ApplicationStatus.Completed].includes(
        disbursementSchedule.studentAssessment.application.applicationStatus,
      )
    ) {
      throw new CustomNamedError(
        "Enrolment cannot be confirmed as application is not in a valid status.",
        ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    if (!options?.allowOutsideCOEApprovalPeriod) {
      const approvalPeriodStatus = this.getCOEApprovalPeriodStatus(
        disbursementSchedule.disbursementDate,
        disbursementSchedule.studentAssessment.application.currentAssessment
          .offering.studyEndDate,
        options?.enrolmentConfirmationDate,
      );
      if (
        approvalPeriodStatus !== COEApprovalPeriodStatus.WithinApprovalPeriod
      ) {
        throw new CustomNamedError(
          "The enrolment cannot be confirmed as enrolment confirmation date is not within the valid approval period.",
          ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
        );
      }
    }

    const firstOutstandingDisbursement =
      await this.getFirstDisbursementScheduleByApplication(
        disbursementSchedule.studentAssessment.application.id,
        true,
      );

    if (disbursementSchedule.id !== firstOutstandingDisbursement.id) {
      throw new CustomNamedError(
        "First disbursement(COE) not complete. Please complete the first disbursement.",
        FIRST_COE_NOT_COMPLETE,
      );
    }

    // If no tuition remittance is set then, it is defaulted to 0.
    // This happens when ministry confirms COE.
    const tuitionRemittanceAmount = tuitionRemittance ?? 0;

    // Validate tuition remittance amount.
    await this.validateTuitionRemittance(
      tuitionRemittanceAmount,
      disbursementSchedule.id,
    );

    await this.updateDisbursementAndApplicationCOEApproval(
      disbursementScheduleId,
      auditUserId,
      disbursementSchedule.studentAssessment.application.id,
      disbursementSchedule.studentAssessment.application.applicationStatus,
      tuitionRemittanceAmount,
      options?.enrolmentConfirmationDate,
    );
  }

  /**
   * Decline the enrolment of an application.
   * @param disbursementScheduleId disbursement schedule id.
   * @param auditUserId user who confirms enrollment.
   * @param declineReason reason for declining the enrolment.
   * @param options decline enrolment options.
   * - `locationId` location id of the application.
   * - `applicationNumber` application number of the enrolment.
   */
  async declineEnrolment(
    disbursementScheduleId: number,
    auditUserId: number,
    declineReason: { coeDenyReasonId: number; otherReasonDesc?: string },
    options?: {
      locationId?: number;
      applicationNumber?: string;
    },
  ): Promise<void> {
    const disbursementSchedule =
      await this.getDisbursementAndApplicationSummary(
        disbursementScheduleId,
        options?.locationId,
      );

    if (!disbursementSchedule) {
      throw new CustomNamedError("Enrolment not found.", ENROLMENT_NOT_FOUND);
    }

    const application = disbursementSchedule.studentAssessment.application;

    if (
      options?.applicationNumber &&
      options?.applicationNumber !== application.applicationNumber
    ) {
      throw new CustomNamedError(
        "Enrolment for the given application not found.",
        ENROLMENT_NOT_FOUND,
      );
    }

    if (disbursementSchedule.coeStatus !== COEStatus.required) {
      throw new CustomNamedError(
        "Enrolment already completed and can neither be confirmed nor declined.",
        ENROLMENT_ALREADY_COMPLETED,
      );
    }

    if (
      ![ApplicationStatus.Enrolment, ApplicationStatus.Completed].includes(
        disbursementSchedule.studentAssessment.application.applicationStatus,
      )
    ) {
      throw new CustomNamedError(
        "Enrolment cannot be declined as application is not in a valid status.",
        ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    await this.updateCOEToDeclined(disbursementSchedule.id, auditUserId, {
      coeDeniedReasonId: declineReason.coeDenyReasonId,
      otherReasonDesc: declineReason.otherReasonDesc,
    });
  }

  /**
   * Validate Institution Users to request tuition remittance at the time
   * of confirming enrolment, not to exceed the lesser than both
   * (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).
   * @param tuitionRemittanceAmount tuition remittance submitted by institution.
   * @param disbursementScheduleId disbursement schedule id.
   * @throws UnprocessableEntityException.
   */
  private async validateTuitionRemittance(
    tuitionRemittanceAmount: number,
    disbursementScheduleId: number,
  ): Promise<void> {
    // If the tuition remittance amount is set to 0, then skip validation.
    if (!tuitionRemittanceAmount) {
      return;
    }

    const maxTuitionAllowed = await this.getEstimatedMaxTuitionRemittance(
      disbursementScheduleId,
    );

    if (tuitionRemittanceAmount > maxTuitionAllowed) {
      throw new CustomNamedError(
        "Tuition amount provided should be lesser than both (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).",
        INVALID_TUITION_REMITTANCE_AMOUNT,
      );
    }
  }

  /**
   * Generates the next document number to be associated
   * with a disbursement.
   * @returns sequence number for disbursement document number.
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
}
