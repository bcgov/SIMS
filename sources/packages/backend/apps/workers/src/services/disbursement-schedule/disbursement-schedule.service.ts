import { Injectable } from "@nestjs/common";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
  MSFAANumber,
  OfferingIntensity,
  RecordDataModelService,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { DataSource, In, IsNull, Not } from "typeorm";
import { MSFAANumberService, SFASSignedMSFAA } from "..";
import {
  DISBURSEMENT_MSFAA_ALREADY_ASSOCIATED,
  DISBURSEMENT_NOT_FOUND,
} from "../../constants";
import {
  MSFAANumberSharedService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  SystemUsersService,
} from "@sims/services";

@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    dataSource: DataSource,
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
    private readonly sfasApplicationService: SFASApplicationService,
    private readonly sfasPartTimeApplicationsService: SFASPartTimeApplicationsService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    super(dataSource.getRepository(DisbursementSchedule));
  }

  /**
   * Associates an MSFAA number to the disbursement(s) checking
   * whatever is needed to create a new MSFAA or use an
   * existing one instead.
   * @param assessmentId assessment id of the workflow instance.
   */
  async associateMSFAANumber(assessmentId: number): Promise<void> {
    const systemUser = this.systemUsersService.systemUser;

    // Get the disbursement schedules for the assessment id.
    const disbursements = await this.getDisbursements(assessmentId);
    const [firstDisbursement] = disbursements;

    if (!firstDisbursement) {
      throw new CustomNamedError(
        "Disbursement not found.",
        DISBURSEMENT_NOT_FOUND,
      );
    }

    if (firstDisbursement.msfaaNumber?.id) {
      throw new CustomNamedError(
        "MSFAA number is already associated.",
        DISBURSEMENT_MSFAA_ALREADY_ASSOCIATED,
      );
    }

    const firstDisbursementOffering =
      firstDisbursement.studentAssessment.offering;
    const firstDisbursementApplication =
      firstDisbursement.studentAssessment.application;
    // Get the existing MSFAA or create MSFAA number.
    const msfaaNumberId = await this.getOrCreateMSFAANumber(
      firstDisbursementApplication.student.id,
      firstDisbursementApplication.id,
      firstDisbursementOffering.offeringIntensity,
      firstDisbursementOffering.studyStartDate,
      systemUser.id,
    );

    const msfaaNumber = { id: msfaaNumberId } as MSFAANumber;
    // Associate all the disbursements of the given assessment with MSFAA.
    disbursements.forEach((disbursement) => {
      disbursement.msfaaNumber = msfaaNumber;
      disbursement.modifier = systemUser;
    });
    await this.repo.save(disbursements);
  }

  /**
   * Update the has_estimated_awards property to false for any disbursement schedule
   * for the assessment id if the final award total is $0.
   * @param assessmentId assessment id.
   * @param finalAwardTotal final award total from the assessment data.
   */
  async updateDisbursementsHasEstimatedAwards(
    assessmentId: number,
    finalAwardTotal: number,
  ): Promise<void> {
    const disbursements = await this.repo.find({
      select: {
        id: true,
      },
      where: {
        studentAssessment: { id: assessmentId },
      },
    });
    if (disbursements.length > 0 && finalAwardTotal === 0) {
      disbursements.forEach(async (disbursement) => {
        await this.repo.update(
          {
            id: disbursement.id,
          },
          {
            hasEstimatedAwards: false,
          },
        );
      });
    }
  }

  /**
   * Get the disbursement schedules for the assessment id.
   * @param assessmentId assessment id.
   * @returns disbursement schedules.
   */
  private async getDisbursements(
    assessmentId: number,
  ): Promise<DisbursementSchedule[]> {
    return this.repo.find({
      select: {
        id: true,
        studentAssessment: {
          id: true,
          application: { id: true, student: { id: true } },
          offering: { id: true, offeringIntensity: true, studyStartDate: true },
        },
        msfaaNumber: {
          id: true,
        },
      },
      relations: {
        studentAssessment: { application: { student: true }, offering: true },
        msfaaNumber: true,
      },
      where: {
        studentAssessment: { id: assessmentId },
      },
    });
  }

  /**
   * Get the existing MSFAA or create MSFAA number.
   * @param studentId student id.
   * @param applicationId application id.
   * @param offeringIntensity offering intensity.
   * @param studyStartDate study start date.
   * @param auditUserId audit user id.
   * @returns MSFAA number id.
   */
  private async getOrCreateMSFAANumber(
    studentId: number,
    applicationId: number,
    offeringIntensity: OfferingIntensity,
    studyStartDate: string,
    auditUserId: number,
  ): Promise<number> {
    // Checks if there is a signed MSFAA that could be considered valid.
    const existingValidSignedMSFAANumber =
      await this.msfaaNumberService.getCurrentValidMSFAANumber(
        studentId,
        offeringIntensity,
        { isSigned: true },
      );
    if (existingValidSignedMSFAANumber) {
      // Reuse the MSFAA that is still valid and avoid creating a new one.
      return existingValidSignedMSFAANumber.id;
    }

    // Get previously completed and signed disbursement of an application for the student
    // to determine if an existing MSFAA is still valid.
    const previousSignedDisbursement =
      await this.getPreviouslySignedDisbursement(studentId, offeringIntensity);

    if (previousSignedDisbursement) {
      const isMSFAANumberStillValid = await this.isMSFAANumberStillValid(
        previousSignedDisbursement.studentAssessment.offering.studyEndDate,
        studyStartDate,
      );
      if (isMSFAANumberStillValid) {
        return previousSignedDisbursement.msfaaNumber.id;
      }
    }

    // Get signed MSFAA from SFAS for the particular offering intensity and create one in SIMS and
    // activate the created MSFAA.
    const sfasSignedMSFAA = await this.getSFASSignedMSFAA(
      studentId,
      offeringIntensity,
    );
    if (sfasSignedMSFAA) {
      return this.msfaaNumberSharedService.importMSFAAumberFromSFAS(
        studentId,
        applicationId,
        offeringIntensity,
        auditUserId,
        sfasSignedMSFAA,
      );
    }

    // If no MSFAA is found, check if there is a pending MSFAA on SIMS.
    const existingValidMSFAANumber =
      await this.msfaaNumberService.getCurrentValidMSFAANumber(
        studentId,
        offeringIntensity,
      );
    if (existingValidMSFAANumber) {
      // Reuse the MSFAA that is still valid and avoid creating a new one, even if it not signed yet.
      return existingValidMSFAANumber.id;
    }

    // Create a new MSFAA number in case no MSFAA is found or no longer valid.
    const newMSFAANumber =
      await this.msfaaNumberSharedService.createMSFAANumber(
        applicationId,
        auditUserId,
      );
    return newMSFAANumber.id;
  }

  /**
   * Gets the student valid MSFAA number signed and the latest SFAS application study end date.
   * @param studentId student id.
   * @param offeringIntensity offering intensity.
   * @returns SFAS signed MSFAA which is valid.
   */
  private async getSFASSignedMSFAA(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<SFASSignedMSFAA> {
    // Checks if there is a MSFAA number that could be considered valid from SFAS.
    if (offeringIntensity === OfferingIntensity.fullTime) {
      return this.sfasApplicationService.getValidMSFAAFullTimeApplication(
        studentId,
      );
    }
    return this.sfasPartTimeApplicationsService.getValidMSFAAPartTimeApplication(
      studentId,
    );
  }

  /**
   * Checks if the MSFAA number is still valid.
   * If the study period end date of the previously signed MSFAA is less than 2 years
   * when compared to current study period start date, then MSFAA is considered to be valid.
   * @param previousDisbursementStudyEndDate previously signed disbursement study end date.
   * @param firstDisbursementStudyStartDate first disbursement study start date.
   * @returns whether the MSFAA Number is valid.
   */
  private async isMSFAANumberStillValid(
    previousDisbursementStudyEndDate: string,
    firstDisbursementStudyStartDate: string,
  ): Promise<boolean> {
    const previousStudyEndDate = new Date(previousDisbursementStudyEndDate);
    const currentStudyStartDate = new Date(firstDisbursementStudyStartDate);
    // Previously signed and completed application offering end date in considered the start date.
    // Start date of the offering of the current application is considered the end date.
    return this.msfaaNumberService.isMSFAANumberValid(
      previousStudyEndDate,
      currentStudyStartDate,
    );
  }

  /**
   * Get the previously signed MSFAA for the student
   * for given offering intensity if exist.
   * MSFAA is generated individually for full-time/part-time
   * offerings.
   * @param studentId student.
   * @param offeringIntensity  offering intensity.
   * @returns most recent previous disbursement from a completed application with a valid signed MSFAA.
   */
  async getPreviouslySignedDisbursement(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<DisbursementSchedule> {
    return this.repo.findOne({
      select: {
        id: true,
        studentAssessment: {
          id: true,
          offering: { id: true, studyEndDate: true },
        },
        msfaaNumber: { id: true },
      },
      relations: {
        studentAssessment: { offering: true },
        msfaaNumber: true,
      },
      where: {
        // Consider only the disbursements which are sent, to identify a previously
        // signed disbursement as pending ones are subject to cancellation any time.
        disbursementScheduleStatus: In([
          DisbursementScheduleStatus.ReadyToSend,
          DisbursementScheduleStatus.Sent,
        ]),
        studentAssessment: {
          offering: { offeringIntensity },
          application: {
            student: { id: studentId },
          },
        },
        msfaaNumber: {
          dateSigned: Not(IsNull()),
          cancelledDate: IsNull(),
        },
      },
      order: { studentAssessment: { offering: { studyEndDate: "DESC" } } },
    });
  }
}
