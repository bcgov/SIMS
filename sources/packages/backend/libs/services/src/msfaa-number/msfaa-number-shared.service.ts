import { Injectable } from "@nestjs/common";
import { DataSource, IsNull, Repository } from "typeorm";
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
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
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
    const application = await this.getApplicationForMSFAACreation(
      referenceApplicationId,
    );
    return this.internalCreateMSFAANumber(
      application.student.id,
      application.id,
      application.currentAssessment.offering.offeringIntensity,
      auditUserId,
    );
  }

  /**
   * Reissues a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * Reissuing an MSFAA is only valid for an application with pending disbursement
   * where the MSFAA is cancelled.
   * @param referenceApplicationId reference application id.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns the newly created MSFAA.
   */
  async reissueMSFAA(
    referenceApplicationId: number,
    auditUserId: number,
  ): Promise<MSFAANumber> {
    const application = await this.getApplicationForMSFAACreation(
      referenceApplicationId,
    );
    // If multiple disbursements are pending they must be associated with the same
    // MSFAA hence selecting the first one should be enough for the validations.
    const [pendingDisbursement] =
      application.currentAssessment.disbursementSchedules.filter(
        (schedule) =>
          schedule.disbursementScheduleStatus ===
          DisbursementScheduleStatus.Pending,
      );
    if (!pendingDisbursement) {
      throw new CustomNamedError(
        "Not possible to reissue an MSFAA when there is no pending disbursements for the application.",
        APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
      );
    }
    if (!pendingDisbursement.msfaaNumber.cancelledDate) {
      throw new CustomNamedError(
        "Not possible to reissue an MSFAA when the current associated MSFAA is not cancelled.",
        APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
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
   * @returns created MSFAA record.
   */
  private async internalCreateMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
  ): Promise<MSFAANumber> {
    return this.dataSource.transaction(async (entityManager) => {
      const auditUser = await this.systemUsersService.systemUser();
      const now = new Date();
      const nowISODate = getISODateOnlyString(now);
      // Cancel any pending MSFAA record that was never reported as signed or cancelled.
      // This will ensure that the newly created MSFAA will be the only one valid.
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
      newMSFAANumber.createdAt = now;
      await entityManager.getRepository(MSFAANumber).save(newMSFAANumber);
      // Associate pending disbursements with the new MSFAA.
      const disbursementScheduleRepo =
        entityManager.getRepository(DisbursementSchedule);
      const schedulesToUpdate = await disbursementScheduleRepo.find({
        select: {
          id: true,
        },
        where: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          studentAssessment: {
            application: { student: { id: studentId } },
            offering: { offeringIntensity: offeringIntensity },
          },
        },
      });
      const schedulesIdsToUpdate = schedulesToUpdate.map(
        (schedule) => schedule.id,
      );
      if (schedulesIdsToUpdate.length) {
        disbursementScheduleRepo.update(schedulesIdsToUpdate, {
          msfaaNumber: newMSFAANumber,
          modifier: auditUser,
          updatedAt: now,
        });
      }
      return newMSFAANumber;
    });
  }

  /**
   * Generates the next number for an MSFAA
   * considering the offering intensity.
   * @param offeringIntensity offering intensity.
   * @returns number to be used for the next MSFAA.
   */
  private async consumeNextSequence(
    offeringIntensity: OfferingIntensity,
  ): Promise<string> {
    let nextNumber: number;
    const sequenceGroupName = `${offeringIntensity}_MSFAA_STUDENT_NUMBER`;
    await this.sequenceService.consumeNextSequence(
      sequenceGroupName,
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
  private async getApplicationForMSFAACreation(
    applicationId: number,
  ): Promise<Application> {
    const application = await this.applicationRepo.findOne({
      select: {
        id: true,
        applicationStatus: true,
        student: {
          id: true,
        },
        currentAssessment: {
          id: true,
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
          disbursementSchedules: {
            msfaaNumber: true,
          },
        },
      },
      where: {
        id: applicationId,
      },
    });

    if (!application) {
      throw new CustomNamedError(
        `Application id ${applicationId} was not found.`,
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
        `Not possible to create an MSFAA when the application status is '${application.applicationStatus}'.`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }
    if (!application.currentAssessment?.offering) {
      throw new CustomNamedError(
        `Not possible to create an MSFAA when the offering is not set.`,
        APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
      );
    }

    return application;
  }
}
