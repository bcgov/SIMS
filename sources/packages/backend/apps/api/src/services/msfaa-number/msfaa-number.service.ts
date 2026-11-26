import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MSFAANumber, NoteType, User } from "@sims/sims-db";
import { DataSource, IsNull, Repository } from "typeorm";
import {
  MSFAAEligibleForReissue,
  MSFAANumberSharedService,
  NoteSharedService,
} from "@sims/services";
import {
  MSFAA_MINISTRY_CANCELLATION_PROVINCE,
  MSFAA_NUMBER_INVALID_OPERATION,
  MSFAA_NUMBER_NOT_FOUND,
} from "@sims/services/constants";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";

/**
 * Service for MSFAA (Master Student Financial Aid Agreement)
 * number activity associated with a student.
 */
@Injectable()
export class MSFAANumberService {
  constructor(
    @InjectRepository(MSFAANumber)
    private readonly msfaaNumberRepo: Repository<MSFAANumber>,
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
  ) {}

  /**
   * Gets all MSFAA numbers associated with a student ordered by creation date newest to oldest.
   * @param studentId student id to filter the MSFAA records.
   * @returns list of MSFAA number records for the student.
   */
  getStudentMSFAAActivity(studentId: number): Promise<MSFAANumber[]> {
    return this.msfaaNumberRepo.find({
      select: {
        id: true,
        createdAt: true,
        offeringIntensity: true,
        msfaaNumber: true,
        dateRequested: true,
        dateSigned: true,
        cancelledDate: true,
        newIssuingProvince: true,
      },
      where: { student: { id: studentId } },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Gets the student MSFAAs that can be reissued.
   * @param studentId student id to check the MSFAA records.
   * @returns MSFAA records eligible to be reissued.
   */
  getMSFAAsEligibleForReissue(
    studentId: number,
  ): Promise<MSFAAEligibleForReissue[]> {
    return this.msfaaNumberSharedService.getMSFAAsEligibleForReissue(studentId);
  }

  /**
   * Cancels an MSFAA that is not cancelled yet and adds a general note to the student profile.
   * @param msfaaNumberId MSFAA to be cancelled.
   * @param noteDescription note describing the cancellation.
   * @param auditUserId user causing the change.
   */
  async cancelMSFAANumber(
    msfaaNumberId: number,
    noteDescription: string,
    auditUserId: number,
  ): Promise<void> {
    const msfaaNumber = await this.msfaaNumberRepo.findOne({
      select: { id: true, student: { id: true } },
      relations: { student: true },
      where: { id: msfaaNumberId },
    });
    if (!msfaaNumber) {
      throw new CustomNamedError(
        `MSFAA number id ${msfaaNumberId} was not found.`,
        MSFAA_NUMBER_NOT_FOUND,
      );
    }
    await this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      // Both operations run in parallel, any failure reverts the entire transaction.
      const [updateResult] = await Promise.all([
        entityManager.getRepository(MSFAANumber).update(
          { id: msfaaNumberId, cancelledDate: IsNull() },
          {
            cancelledDate: getISODateOnlyString(now),
            newIssuingProvince: MSFAA_MINISTRY_CANCELLATION_PROVINCE,
            modifier: { id: auditUserId } as User,
            updatedAt: now,
          },
        ),
        this.noteSharedService.createStudentNote(
          msfaaNumber.student.id,
          NoteType.General,
          noteDescription,
          auditUserId,
          entityManager,
        ),
      ]);
      if (!updateResult.affected) {
        throw new CustomNamedError(
          "Not possible to cancel an MSFAA that is already cancelled.",
          MSFAA_NUMBER_INVALID_OPERATION,
        );
      }
    });
  }

  /**
   * Reissues a cancelled MSFAA and adds a general note to the student profile.
   * @param msfaaNumberId cancelled MSFAA to be reissued.
   * @param noteDescription note describing the reissue.
   * @param auditUserId user causing the change.
   * @returns the newly created MSFAA.
   */
  reissueMSFAANumber(
    msfaaNumberId: number,
    noteDescription: string,
    auditUserId: number,
  ): Promise<MSFAANumber> {
    return this.dataSource.transaction(async (entityManager) => {
      const newMSFAA = await this.msfaaNumberSharedService.reissueMSFAANumber(
        msfaaNumberId,
        auditUserId,
        entityManager,
      );
      await this.noteSharedService.createStudentNote(
        newMSFAA.student.id,
        NoteType.General,
        noteDescription,
        auditUserId,
        entityManager,
      );
      return newMSFAA;
    });
  }
}
