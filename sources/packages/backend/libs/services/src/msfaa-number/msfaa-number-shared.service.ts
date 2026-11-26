import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, IsNull, Not, Repository } from "typeorm";
import {
  MSFAANumber,
  Student,
  Application,
  OfferingIntensity,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  User,
} from "@sims/sims-db";
import {
  SFASSignedMSFAA,
  SequenceControlService,
  SystemUsersService,
} from "@sims/services";
import { InjectRepository } from "@nestjs/typeorm";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import {
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
  APPLICATION_NOT_FOUND,
  MSFAA_INELIGIBLE,
  MSFAA_NUMBER_NOT_FOUND,
} from "../constants";
import { ConfigService } from "@sims/utilities/config";
import { MSFAAEligibleForReissue } from "./msfaa-number.models";

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
    private readonly configService: ConfigService,
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
   * Gets the MSFAAs that can be reissued.
   * For each offering intensity, when there is any pending disbursement associated with
   * a cancelled MSFAA, the MSFAA of the oldest pending disbursement is returned and the
   * application of that disbursement is the reference for the new MSFAA.
   * @param studentId student to have the MSFAA records checked.
   * @param entityManager entity manager to be used instead of the default one, when provided.
   * @returns MSFAA records eligible to be reissued.
   */
  async getMSFAAsEligibleForReissue(
    studentId: number,
    entityManager?: EntityManager,
  ): Promise<MSFAAEligibleForReissue[]> {
    const manager = entityManager ?? this.dataSource.manager;
    const disbursementRepo = manager.getRepository(DisbursementSchedule);
    const eligibleMSFAAs = await Promise.all(
      [OfferingIntensity.fullTime, OfferingIntensity.partTime].map(
        async (offeringIntensity) => {
          const oldestPendingDisbursement = await disbursementRepo.findOne({
            select: {
              id: true,
              msfaaNumber: { id: true },
              studentAssessment: { id: true, application: { id: true } },
            },
            relations: {
              msfaaNumber: true,
              studentAssessment: { application: true },
            },
            where: {
              disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
              msfaaNumber: {
                student: { id: studentId },
                offeringIntensity,
                cancelledDate: Not(IsNull()),
              },
            },
            order: { id: "ASC" },
          });
          if (!oldestPendingDisbursement) {
            return null;
          }
          return {
            id: oldestPendingDisbursement.msfaaNumber.id,
            offeringIntensity,
            referenceApplicationId:
              oldestPendingDisbursement.studentAssessment.application.id,
          };
        },
      ),
    );
    return eligibleMSFAAs.filter((msfaa) => !!msfaa);
  }

  /**
   * Reissues a new MSFAA number to replace a cancelled one, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param msfaaNumberId cancelled MSFAA to be reissued.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager transactional entity manager, allowing the reissue to be
   * part of a larger transaction.
   * @returns the newly created MSFAA.
   */
  async reissueMSFAANumber(
    msfaaNumberId: number,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<MSFAANumber> {
    const msfaaNumber = await entityManager.getRepository(MSFAANumber).findOne({
      select: {
        id: true,
        offeringIntensity: true,
        cancelledDate: true,
        student: { id: true },
      },
      relations: { student: true },
      // Loading the relation in a separate query allows to lock only the MSFAA record.
      relationLoadStrategy: "query",
      where: { id: msfaaNumberId },
      // Serializes concurrent reissues of the same MSFAA, so the eligibility
      // is checked again after any in-flight reissue has been committed.
      lock: { mode: "pessimistic_write" },
    });
    if (!msfaaNumber) {
      throw new CustomNamedError(
        `MSFAA number id ${msfaaNumberId} was not found.`,
        MSFAA_NUMBER_NOT_FOUND,
      );
    }
    const eligibleMSFAAs = await this.getMSFAAsEligibleForReissue(
      msfaaNumber.student.id,
      entityManager,
    );
    // A cancelled MSFAA can be reissued when there are pending disbursements to be associated with the new MSFAA.
    const eligibleMSFAA = msfaaNumber.cancelledDate
      ? eligibleMSFAAs.find(
          (eligible) =>
            eligible.offeringIntensity === msfaaNumber.offeringIntensity,
        )
      : undefined;
    if (!eligibleMSFAA) {
      throw new CustomNamedError(
        "Not possible to reissue an MSFAA that is not cancelled or has no pending disbursements associated.",
        MSFAA_INELIGIBLE,
      );
    }
    return this.internalActivateMSFAANumber(
      msfaaNumber.student.id,
      eligibleMSFAA.referenceApplicationId,
      msfaaNumber.offeringIntensity,
      auditUserId,
      { entityManager },
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
    serviceProviderReceivedDate?: Date,
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
   * - `entityManager` transactional entity manager to be used when the activation must be
   * part of an existing transaction. When not provided, a new transaction is created.
   * @returns created MSFAA record.
   */
  private async internalActivateMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
    options?: {
      existingMSFAA?: Pick<
        MSFAANumber,
        "id" | "msfaaNumber" | "dateSigned" | "serviceProviderReceivedDate"
      >;
      entityManager?: EntityManager;
    },
  ): Promise<MSFAANumber> {
    const activate = async (
      entityManager: EntityManager,
    ): Promise<MSFAANumber> => {
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
        newActiveMSFAA.msfaaNumber =
          await this.consumeNextSequence(offeringIntensity);
        newActiveMSFAA.student = { id: studentId } as Student;
        newActiveMSFAA.referenceApplication = {
          id: referenceApplicationId,
        } as Application;
        newActiveMSFAA.offeringIntensity = offeringIntensity;
        newActiveMSFAA.creator = { id: auditUserId } as User;
        newActiveMSFAA.createdAt = now;
        if (this.configService.bypassMSFAASigning) {
          // Only for non-production environments where MSFAA signing can be bypassed.
          // When bypassing MSFAA signing, set the date requested and signed to now.
          newActiveMSFAA.dateRequested = now;
          newActiveMSFAA.dateSigned = nowISODate;
        }
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
    };
    if (options?.entityManager) {
      return activate(options.entityManager);
    }
    return this.dataSource.transaction(activate);
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
        student: {
          id: true,
        },
        currentAssessment: {
          id: true,
          offering: {
            offeringIntensity: true,
          },
        },
      },
      relations: {
        student: true,
        currentAssessment: {
          offering: true,
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
    if (!application.currentAssessment?.offering) {
      throw new CustomNamedError(
        `Not possible to create an MSFAA when the offering is not set.`,
        APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
      );
    }

    return application;
  }

  /**
   * Create and activate the MSFAA number fetched from SFAS signed MSFAA.
   * @param studentId student Id.
   * @param offeringIntensity offering intensity.
   * @param applicationId application id.
   * @param auditUserId audit user id.
   * @param sfasSignedMSFAA SFAS MSFAA number and latest SFAS application end date.
   * @returns created and activated MSFAA number id.
   */
  async importMSFAAumberFromSFAS(
    studentId: number,
    applicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
    sfasSignedMSFAA: SFASSignedMSFAA,
  ): Promise<number | null> {
    // Create and activate new MSFAA number from the SFAS records.
    const sfasMSFAANumber = new MSFAANumber();
    sfasMSFAANumber.msfaaNumber = sfasSignedMSFAA.sfasMSFAANumber;
    sfasMSFAANumber.dateSigned = getISODateOnlyString(
      sfasSignedMSFAA.latestSFASApplicationEndDate,
    );
    sfasMSFAANumber.referenceApplication = { id: applicationId } as Application;
    sfasMSFAANumber.student = { id: studentId } as Student;
    sfasMSFAANumber.offeringIntensity = offeringIntensity;
    sfasMSFAANumber.creator = { id: auditUserId } as User;
    const createdMSFAANumber = await this.dataSource
      .getRepository(MSFAANumber)
      .save(sfasMSFAANumber);
    const activateMSFAANumber = await this.internalActivateMSFAANumber(
      createdMSFAANumber.student.id,
      createdMSFAANumber.referenceApplication.id,
      createdMSFAANumber.offeringIntensity,
      auditUserId,
      {
        existingMSFAA: {
          id: createdMSFAANumber.id,
          msfaaNumber: createdMSFAANumber.msfaaNumber,
          dateSigned: createdMSFAANumber.dateSigned,
        },
      },
    );
    return activateMSFAANumber.id;
  }
}
