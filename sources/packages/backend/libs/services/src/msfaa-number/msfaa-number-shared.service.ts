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
} from "@sims/sims-db";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import { InjectRepository } from "@nestjs/typeorm";
import { getISODateOnlyString } from "@sims/utilities";

/**
 * Service layer for MSFAA (Master Student Financial Aid Agreement)
 * numbers generated for a student.
 */
@Injectable()
export class MSFAANumberSharedService {
  constructor(
    @InjectRepository(MSFAANumber)
    private readonly msfaaNumberRepo: Repository<MSFAANumber>,
    private readonly dataSource: DataSource,
    private readonly sequenceService: SequenceControlService,
    private readonly systemUsersService: SystemUsersService,
  ) {}

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
  async createMSFAANumber(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
    auditUserId: number,
    options?: {
      entityManager?: EntityManager;
      createdAt?: Date;
    },
  ): Promise<MSFAANumber> {
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
    const repo =
      options.entityManager?.getRepository(MSFAANumber) ?? this.msfaaNumberRepo;
    return repo.save(newMSFAANumber);
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
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param studentId student to have a new MSFAA record created.
   * @param referenceApplicationId reference application id.
   * @param offeringIntensity offering intensity.
   */
  async reissueMSFAA(
    studentId: number,
    referenceApplicationId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<void> {
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
      const newMSFAANumber = await this.createMSFAANumber(
        studentId,
        referenceApplicationId,
        offeringIntensity,
        auditUser.id,
        { entityManager, createdAt: now },
      );
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
    });
  }
}
