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
    private readonly msfaaNumberRepo: Repository<MSFAANumber>,
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
    return this.internalActivateMSFAANumber(
      application.student.id,
      application.id,
      application.currentAssessment.offering.offeringIntensity,
      auditUserId,
    );
  }

  /**
   * Creates a new MSFAA number from the SFAS MSFAA number
   * for the particular offering intensity and also activating the
   * new MSFAA number for the same offering intensity.
   * @param sfasMSFAANumber SFAS MSFAA number.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * individually based on, for instance, the Part time/Full time.
   * @returns created and activated MSFAA record.
   */
  async createAndActivateMSFAANumber(
    sfasMSFAANumber: Partial<MSFAANumber>,
    auditUserId: number,
  ): Promise<MSFAANumber> {
    const msfaaNumberRecord = await this.msfaaNumberRepo.save(sfasMSFAANumber);

    return this.internalActivateMSFAANumber(
      msfaaNumberRecord.student.id,
      msfaaNumberRecord.referenceApplication.id,
      msfaaNumberRecord.offeringIntensity,
      auditUserId,
      {
        existingMSFAA: {
          id: msfaaNumberRecord.id,
          msfaaNumber: msfaaNumberRecord.msfaaNumber,
        },
      },
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
    return this.internalActivateMSFAANumber(
      application.student.id,
      application.id,
      application.currentAssessment.offering.offeringIntensity,
      auditUserId,
    );
  }

  /**
   * Reactivates the provided MSFAA record or reuse the SFAS signed MSFAA record for the specified student.
   * @param studentId student for which the MSFAA record will be reactivated.
   * @param referenceApplicationId reference application id.
   * @param offeringIntensity offering intensity.
   * @param auditUserId user causing the change.
   * @param msfaaNumber msfaaNumber to be reactivated.
   * @param dateSigned date the msfaaNumber got signed.
   * @param serviceProviderReceivedDate serviceProviderReceivedDate date.
   * @returns reactivated MSFAA record.
   */
  async reactivateMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
    msfaaNumber: Partial<MSFAANumber>,
    dateSigned: Date,
    serviceProviderReceivedDate: Date | null,
  ): Promise<MSFAANumber> {
    return this.internalActivateMSFAANumber(
      studentId,
      referenceApplicationId,
      offeringIntensity,
      auditUserId,
      {
        existingMSFAA: {
          id: msfaaNumber.id,
          msfaaNumber: msfaaNumber.msfaaNumber,
          dateSigned: getISODateOnlyString(dateSigned),
          serviceProviderReceivedDate: getISODateOnlyString(
            serviceProviderReceivedDate,
          ),
        },
      },
    );
  }

  /**
   * Creates a new MSFAA record with a new number or associates an existing MSFAA record for the specified student.
   * @param studentId student to have a new MSFAA record created.
   * @param referenceApplicationId reference application id.
   * @param offeringIntensity offering intensity.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * individually based on, for instance, the Part time/Full time.
   * @param options to reactivate msfaa record.
   * - `existingMSFAA` containing the msfaaNumberId as the id of the msfaaNumber,
   * msfaaNumber as the msfaaNumber of the msfaa record,
   * dateSigned as the date the msfaaNumber got signed,
   * and serviceProviderReceivedDate as the serviceProviderReceivedDate of the msfaa record to be reactivated.
   * @returns created MSFAA record.
   */
  private async internalActivateMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
    options?: {
      existingMSFAA: Pick<
        MSFAANumber,
        "id" | "msfaaNumber" | "dateSigned" | "serviceProviderReceivedDate"
      >;
    },
  ): Promise<MSFAANumber> {
    return this.dataSource.transaction(async (entityManager) => {
      const auditUser = this.systemUsersService.systemUser;
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
      // The reactivated msfaaNumber.
      let newActiveMSFAA = options?.existingMSFAA as MSFAANumber;
      // If there is not a MSFAA number to be re-activated.
      if (!options?.existingMSFAA) {
        // Create the new MSFAA record for the student.
        newActiveMSFAA = new MSFAANumber();
        newActiveMSFAA.msfaaNumber = await this.consumeNextSequence(
          offeringIntensity,
        );
        newActiveMSFAA.student = { id: studentId } as Student;
        newActiveMSFAA.referenceApplication = {
          id: referenceApplicationId,
        } as Application;
        newActiveMSFAA.offeringIntensity = offeringIntensity;
        newActiveMSFAA.creator = { id: auditUserId } as User;
        newActiveMSFAA.createdAt = now;
        await entityManager.getRepository(MSFAANumber).save(newActiveMSFAA);
      } else {
        // Reactivate this msfaa record.
        const systemUser = this.systemUsersService.systemUser;
        const updateResult = await this.dataSource
          .getRepository(MSFAANumber)
          .update(options.existingMSFAA.id, {
            dateSigned: options.existingMSFAA.dateSigned,
            serviceProviderReceivedDate:
              options.existingMSFAA.serviceProviderReceivedDate,
            cancelledDate: null,
            newIssuingProvince: null,
            modifier: systemUser,
          });
        // Incase no record updated.
        if (!updateResult.affected) {
          throw new Error(
            `Error while updating MSFAA number: ${options.existingMSFAA.msfaaNumber}. Number of affected rows was ${updateResult.affected}, expected 1.`,
          );
        }
      }
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
        await disbursementScheduleRepo.update(schedulesIdsToUpdate, {
          msfaaNumber: newActiveMSFAA,
          modifier: auditUser,
          updatedAt: now,
        });
      }
      return newActiveMSFAA;
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
