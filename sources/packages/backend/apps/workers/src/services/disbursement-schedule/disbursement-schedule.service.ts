import { Injectable } from "@nestjs/common";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
  MSFAANumber,
  OfferingIntensity,
  RecordDataModelService,
  SFASApplication,
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
  SFASIndividualService,
  SystemUsersService,
} from "@sims/services";

@Injectable()
export class DisbursementScheduleService extends RecordDataModelService<DisbursementSchedule> {
  constructor(
    dataSource: DataSource,
    private readonly msfaaNumberService: MSFAANumberService,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly sfasIndividualService: SFASIndividualService,
    private readonly sfasApplicationService: SFASApplicationService,
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
    const disbursements = await this.repo.find({
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

    let msfaaNumberId: number;

    const studentId =
      firstDisbursement.studentAssessment.application.student.id;
    const offeringIntensity =
      firstDisbursement.studentAssessment.offering.offeringIntensity;
    const applicationId = firstDisbursement.studentAssessment.application.id;
    const systemUser = this.systemUsersService.systemUser;

    // Checks if there is an signed MSFAA that could be considered valid.
    const existingValidMSFAANumber =
      await this.msfaaNumberService.getCurrentValidMSFAANumber(
        studentId,
        offeringIntensity,
        true,
      );
    if (existingValidMSFAANumber) {
      // Reuse the MSFAA that is still valid and avoid creating a new one.
      msfaaNumberId = existingValidMSFAANumber.id;
    } else {
      // Get previously completed and signed disbursement of an application for the student
      // to determine if an existing MSFAA is still valid.
      const previousSignedDisbursement =
        await this.getPreviouslySignedDisbursement(
          studentId,
          offeringIntensity,
        );

      let hasValidMSFAANumber = false;

      if (previousSignedDisbursement) {
        // Checks if the MSFAA number is still valid.
        // If the study period end date of the previously signed MSFAA is less than 2 years
        // when compared to current study period start date, then MSFAA is considered to be valid.
        hasValidMSFAANumber = this.msfaaNumberService.isMSFAANumberValid(
          // Previously signed and completed application offering end date in considered the start date.
          new Date(
            previousSignedDisbursement.studentAssessment.offering.studyEndDate,
          ),
          // Start date of the offering of the current application is considered the end date.
          new Date(firstDisbursement.studentAssessment.offering.studyStartDate),
        );
      } else {
        const sfasSignedMSFAA = await this.checkSFASSignedMSFAA(
          studentId,
          offeringIntensity,
        );
        if (sfasSignedMSFAA.latestSfasApplication) {
          // Create new MSFAA number from the SFAS records.
          const newMSFAANumber =
            await this.msfaaNumberSharedService.reactivateOrReuseMSFAANumber(
              studentId,
              applicationId,
              offeringIntensity,
              systemUser.id,
              { msfaaNumber: sfasSignedMSFAA.sfasMSFAANumber },
              sfasSignedMSFAA.latestSfasApplication.endDate,
            );
          hasValidMSFAANumber = true;
          msfaaNumberId = newMSFAANumber.id;
        }
      }

      if (hasValidMSFAANumber) {
        // Reuse the MSFAA number.
        msfaaNumberId = msfaaNumberId
          ? msfaaNumberId
          : previousSignedDisbursement.msfaaNumber.id;
      } else {
        const existingValidMSFAANumber =
          await this.msfaaNumberService.getCurrentValidMSFAANumber(
            studentId,
            offeringIntensity,
          );
        if (existingValidMSFAANumber) {
          // Reuse the MSFAA that is still valid and avoid creating a new one.
          msfaaNumberId = existingValidMSFAANumber.id;
        } else {
          // Create a new MSFAA number in case the previous one is no longer valid.
          const newMSFAANumber =
            await this.msfaaNumberSharedService.createMSFAANumber(
              applicationId,
              systemUser.id,
            );
          msfaaNumberId = newMSFAANumber.id;
        }
      }
    }
    const msfaaNumber = { id: msfaaNumberId } as MSFAANumber;

    // Associate all the disbursements of the given assessment with MSFAA.
    disbursements.forEach((disbursement) => {
      disbursement.msfaaNumber = msfaaNumber;
      disbursement.modifier = systemUser;
    });
    await this.repo.save(disbursements);
  }

  private async checkSFASSignedMSFAA(
    studentId: number,
    offeringIntensity: OfferingIntensity,
  ): Promise<SFASSignedMSFAA> {
    let sfasMSFAANumber: string;
    // Checks if there is a MSFAA number that could be considered valid from SFAS.
    const sfasMSFAA =
      await this.sfasIndividualService.getIndividualStudentByStudentId(
        studentId,
      );
    sfasMSFAANumber =
      offeringIntensity === OfferingIntensity.partTime
        ? sfasMSFAA?.partTimeMSFAANumber
        : sfasMSFAA?.msfaaNumber;
    let latestSfasApplication: SFASApplication;
    if (sfasMSFAA) {
      [latestSfasApplication] =
        await this.sfasApplicationService.getIndividualApplicationByIndividualId(
          sfasMSFAA.id,
        );
    }
    return { sfasMSFAANumber, latestSfasApplication };
  }

  /**
   * Get the previously signed MSFAA for the student
   * for given offering intensity if exist.
   ** MSFAA is generated individually for full-time/part-time
   ** offerings.
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
