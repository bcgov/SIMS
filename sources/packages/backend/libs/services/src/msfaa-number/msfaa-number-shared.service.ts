import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, IsNull, Repository } from "typeorm";
import {
  MSFAANumber,
  Student,
  Application,
  OfferingIntensity,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  User,
  ApplicationStatus,
} from "@sims/sims-db";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import { InjectRepository } from "@nestjs/typeorm";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import {
  APPLICATION_INVALID_DATA_TO_REISSUE_MSFAA_ERROR,
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "../constants";

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberSharedService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

  /**
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param referenceApplicationId reference application id.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * individually based on, for instance, the Part time/Full time.
   * @returns created MSFAA record.
   */
  async createMSFAANumber(
    referenceApplicationId: number,
    auditUserId: number,
  ): Promise<MSFAANumber> {
    const application = await this.getApplicationForMSFAAReissue(
      referenceApplicationId,
    );
    if (!application) {
      throw new CustomNamedError(
        `Application id ${referenceApplicationId} was not found.`,
        APPLICATION_NOT_FOUND,
      );
    }
    const nowAllowedApplicationStatuses = [
      ApplicationStatus.Draft,
      ApplicationStatus.Cancelled,
      ApplicationStatus.Overwritten,
    ];
    if (nowAllowedApplicationStatuses.includes(application.applicationStatus)) {
      throw new CustomNamedError(
        `Not possible to create or reissue an MSFAA when the application status is '${application.applicationStatus}'.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }
    return this.internalCreateMSFAANumber(
      application.student.id,
      application.id,
      application.currentAssessment.offering.offeringIntensity,
      auditUserId,
    );
  }

  /**
   * Reissue a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * Reissuing an MSFAA is only valid for application with pending disbursement
   * where the MSFAA is cancelled.
   * @param referenceApplicationId reference application id.
   * @returns the newly created MSFAA.
   */
  async reissueMSFAA(
    referenceApplicationId: number,
    auditUserId: number,
  ): Promise<MSFAANumber> {
    const application = await this.getApplicationForMSFAAReissue(
      referenceApplicationId,
    );
    const pendingDisbursement =
      application.currentAssessment.disbursementSchedules.find(
        (schedule) =>
          schedule.disbursementScheduleStatus ===
          DisbursementScheduleStatus.Pending,
      );
    if (!pendingDisbursement) {
      throw new CustomNamedError(
        "Not possible to reissue an MSFAA when there is no pending disbursements for the application.",
        APPLICATION_INVALID_DATA_TO_REISSUE_MSFAA_ERROR,
      );
    }
    if (!pendingDisbursement.msfaaNumber.cancelledDate) {
      throw new CustomNamedError(
        "Not possible to reissue an MSFAA when the current associated MSFAA is not cancelled.",
        APPLICATION_INVALID_DATA_TO_REISSUE_MSFAA_ERROR,
      );
    }
    return this.internalCreateMSFAANumber(
      application.student.id,
      application.id,
      application.currentAssessment.offering.offeringIntensity,
      auditUserId,
    );
  }

  /**
   * Creates a new MSFAA record with a new number for the specified student.
   * @param studentId student to have a new MSFAA record created.
   * @param referenceApplicationId reference application id.
   * @param offeringIntensity offering intensity.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * individually based on, for instance, the Part time/Full time.
   * @param options creation options.
   * - `entityManager` optionally used to execute the queries in the same transaction.
   * - `createdAt` audit date to be considered as the MSFAA creation.
   * @returns created MSFAA record.
   */
  private async internalCreateMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
    options?: {
      createdAt?: Date;
    },
  ): Promise<MSFAANumber> {
    return this.dataSource.transaction(async (entityManager) => {
      const auditUser = await this.systemUsersService.systemUser();
      const now = new Date();
      const nowISODate = getISODateOnlyString(now);
      // Cancel any pending MSFAA record that was never reported as signed or cancelled.
      await entityManager.getRepository(MSFAANumber).update(
        {
          student: { id: studentId },
          offeringIntensity,
          dateSigned: IsNull(),
          cancelledDate: IsNull(),
        },
        {
          cancelledDate: nowISODate,
          modifier: auditUser,
          updatedAt: now,
        },
      );
      // Create the new MSFAA record for the student.
      const newMSFAANumber = new MSFAANumber();
      newMSFAANumber.msfaaNumber = await this.consumeNextSequence(
        offeringIntensity,
      );
      newMSFAANumber.student = { id: studentId } as Student;
      newMSFAANumber.referenceApplication = {
        id: referenceApplicationId,
      } as Application;
      newMSFAANumber.offeringIntensity = offeringIntensity;
      newMSFAANumber.creator = { id: auditUserId } as User;
      newMSFAANumber.createdAt = options?.createdAt;
      await entityManager.getRepository(MSFAANumber).save(newMSFAANumber);
      // Associate pending disbursements with the new MSFAA.
      await entityManager.getRepository(DisbursementSchedule).update(
        {
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          studentAssessment: {
            application: { student: { id: studentId } },
            offering: { offeringIntensity: offeringIntensity },
          },
        },
        {
          msfaaNumber: newMSFAANumber,
          modifier: auditUser,
          updatedAt: now,
        },
      );
      return newMSFAANumber;
    });
  }

  /**
   * Generates the next number for an MSFAA.
   * @returns number to be used for the next MSFAA.
   */
  private async consumeNextSequence(
    offeringIntensity: OfferingIntensity,
  ): Promise<string> {
    let nextNumber: number;
    await this.sequenceService.consumeNextSequence(
      offeringIntensity + "_MSFAA_STUDENT_NUMBER",
      async (nextSequenceNumber: number) => {
        nextNumber = nextSequenceNumber;
      },
    );
    return nextNumber.toString();
  }

  /**
   * Get the application information needed to generate a new MSFAA.
   * @param applicationId reference application for the MSFAA creation.
   * @returns the application with the data needed for the MSFAA creation.
   */
  private async getApplicationForMSFAAReissue(
    applicationId: number,
  ): Promise<Application> {
    return this.applicationRepo.findOne({
      select: {
        id: true,
        student: {
          id: true,
        },
        currentAssessment: {
          offering: {
            offeringIntensity: true,
          },
          disbursementSchedules: {
            id: true,
            disbursementScheduleStatus: true,
            msfaaNumber: {
              id: true,
              cancelledDate: true,
            },
          },
        },
      },
      relations: {
        student: true,
        currentAssessment: {
          offering: true,
          disbursementSchedules: true,
        },
      },
      where: {
        id: applicationId,
      },
    });
  }
}
